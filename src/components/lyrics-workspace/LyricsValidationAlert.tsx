/**
 * Lyrics Validation Alert Component
 * Shows Suno AI validation warnings with auto-fix capability
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Wand2,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LyricsValidator, type ValidationIssue, type SunoValidationResult } from '@/lib/lyrics/LyricsValidator';
import { toast } from 'sonner';

interface LyricsValidationAlertProps {
  lyrics: string;
  onAutoFix?: (fixedLyrics: string) => void;
  compact?: boolean;
  className?: string;
}

export function LyricsValidationAlert({
  lyrics,
  onAutoFix,
  compact = false,
  className,
}: LyricsValidationAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const validation = useMemo(() => {
    if (!lyrics.trim()) return null;
    return LyricsValidator.validateForSuno(lyrics);
  }, [lyrics]);

  const handleAutoFix = () => {
    const { fixed, appliedFixes } = LyricsValidator.autoFixIssues(lyrics);
    if (appliedFixes.length > 0) {
      onAutoFix?.(fixed);
      toast.success(`Исправлено: ${appliedFixes.length} проблем`, {
        description: appliedFixes.slice(0, 3).join(', ') + (appliedFixes.length > 3 ? '...' : ''),
      });
    } else {
      toast.info('Нет проблем для автоматического исправления');
    }
  };

  if (!validation || !lyrics.trim()) return null;

  const errorCount = validation.issues.filter(i => i.type === 'error').length;
  const warningCount = validation.issues.filter(i => i.type === 'warning').length;
  const infoCount = validation.issues.filter(i => i.type === 'info').length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    if (score >= 40) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  const getIssueIcon = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
          getScoreBg(validation.score),
          getScoreColor(validation.score)
        )}>
          {validation.score >= 80 ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          <span>{validation.score}</span>
        </div>
        
        {validation.issues.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {validation.issues.length} {validation.issues.length === 1 ? 'проблема' : 'проблем'}
          </span>
        )}

        {validation.canAutoFix && onAutoFix && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={handleAutoFix}
          >
            <Wand2 className="w-3 h-3" />
            Исправить
          </Button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-3 space-y-3',
        validation.score >= 80 
          ? 'bg-green-500/5 border-green-500/20' 
          : validation.score >= 60
            ? 'bg-yellow-500/5 border-yellow-500/20'
            : 'bg-red-500/5 border-red-500/20',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full',
            getScoreBg(validation.score)
          )}>
            {validation.score >= 80 ? (
              <CheckCircle2 className={cn('w-5 h-5', getScoreColor(validation.score))} />
            ) : (
              <AlertTriangle className={cn('w-5 h-5', getScoreColor(validation.score))} />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('text-lg font-bold', getScoreColor(validation.score))}>
                {validation.score}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {validation.score >= 80 
                ? 'Отлично для Suno AI' 
                : validation.score >= 60
                  ? 'Есть что улучшить'
                  : 'Требуется доработка'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errorCount} ошибок
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-600">
              {warningCount} предупреждений
            </Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={validation.score} className="h-1.5" />

      {/* Issues List */}
      {validation.issues.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {validation.issues.length} {validation.issues.length === 1 ? 'проблема' : 'проблем'}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-2">
                  {validation.issues.map((issue, idx) => (
                    <div
                      key={`${issue.code}-${idx}`}
                      className="flex items-start gap-2 p-2 rounded-lg bg-background/50"
                    >
                      {getIssueIcon(issue.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{issue.message}</p>
                        {issue.fix && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            💡 {issue.fix}
                          </p>
                        )}
                      </div>
                      {issue.autoFixable && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          Auto-fix
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Auto-fix button */}
      {validation.canAutoFix && onAutoFix && (
        <Button
          onClick={handleAutoFix}
          className="w-full gap-2"
          variant="secondary"
          size="sm"
        >
          <Sparkles className="w-4 h-4" />
          Автоматически исправить проблемы
        </Button>
      )}
    </motion.div>
  );
}