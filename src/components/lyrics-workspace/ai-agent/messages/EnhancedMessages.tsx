/**
 * Enhanced message components for AI chat
 * Better visualization of lyrics, analysis, and validation results
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Check, Copy, FileText, ChevronDown, ChevronUp, 
  AlertTriangle, CheckCircle2, XCircle, Sparkles,
  BarChart3, Music2, Tag, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

// ============================================
// LyricsGeneratedMessage - For displaying generated lyrics
// ============================================
interface LyricsGeneratedMessageProps {
  lyrics: string;
  onApply?: () => void;
  onInsert?: (lyrics: string) => void;
  onCopy?: () => void;
  showApplyButton?: boolean;
}

export function LyricsGeneratedMessage({ 
  lyrics, 
  onApply, 
  onInsert,
  onCopy,
  showApplyButton = true 
}: LyricsGeneratedMessageProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const lines = lyrics.split('\n');
  const previewLines = 8;
  const isLong = lines.length > previewLines;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(lyrics);
    setCopied(true);
    hapticImpact('light');
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const handleApply = () => {
    hapticImpact('medium');
    onApply?.();
  };

  const displayLines = expanded ? lines : lines.slice(0, previewLines);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-lg border border-primary/20 bg-primary/5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-primary/10 bg-primary/10">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">Сгенерированный текст</span>
          <Badge variant="secondary" className="text-[10px] h-4">
            {lines.length} строк
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 gap-1"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          <span className="text-[10px]">{copied ? 'Скопировано' : 'Копировать'}</span>
        </Button>
      </div>

      {/* Lyrics preview */}
      <div className="p-3">
        <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
          {displayLines.join('\n')}
        </pre>
        
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Свернуть
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Показать ещё {lines.length - previewLines} строк
              </>
            )}
          </button>
        )}
      </div>

      {/* Actions */}
      {showApplyButton && (
        <div className="flex gap-2 px-3 pb-3">
          <Button
            onClick={handleApply}
            className="flex-1 gap-2"
            size="sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Применить
          </Button>
          {onInsert && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onInsert(lyrics)}
              className="px-3"
            >
              Вставить
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// AnalysisMessage - For displaying analysis results
// ============================================
interface AnalysisStats {
  qualityScore: number;
  syllableStats: {
    avg: number;
    min: number;
    max: number;
    optimalCount: number;
    overlongCount: number;
  };
  rhymeScheme: string;
  clicheCount: number;
  tagBalance: {
    structural: number;
    vocal: number;
    dynamic: number;
    instrumental: number;
  };
  recommendations: string[];
}

interface AnalysisMessageProps {
  stats: AnalysisStats;
  onFix?: (recommendation: string) => void;
}

export function AnalysisMessage({ stats, onFix }: AnalysisMessageProps) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor = stats.qualityScore >= 80 
    ? 'text-emerald-400' 
    : stats.qualityScore >= 60 
      ? 'text-amber-400' 
      : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-lg border border-purple-500/20 bg-purple-500/5 overflow-hidden"
    >
      {/* Header with score */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-purple-500/10 bg-purple-500/10">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium">Анализ текста</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-lg font-bold", scoreColor)}>
            {stats.qualityScore}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Quality progress bar */}
        <div className="space-y-1">
          <Progress value={stats.qualityScore} className="h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Качество</span>
            <span>{stats.qualityScore >= 80 ? 'Отлично' : stats.qualityScore >= 60 ? 'Хорошо' : 'Требует доработки'}</span>
          </div>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Music2 className="w-3.5 h-3.5 mx-auto mb-1 text-blue-400" />
            <p className="text-[10px] text-muted-foreground">Рифмы</p>
            <p className="text-xs font-medium">{stats.rhymeScheme || 'N/A'}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Zap className="w-3.5 h-3.5 mx-auto mb-1 text-amber-400" />
            <p className="text-[10px] text-muted-foreground">Ср. слоги</p>
            <p className="text-xs font-medium">{stats.syllableStats.avg.toFixed(1)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Tag className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
            <p className="text-[10px] text-muted-foreground">Теги</p>
            <p className="text-xs font-medium">
              {stats.tagBalance.structural + stats.tagBalance.vocal + stats.tagBalance.dynamic}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <AlertTriangle className="w-3.5 h-3.5 mx-auto mb-1 text-red-400" />
            <p className="text-[10px] text-muted-foreground">Клише</p>
            <p className="text-xs font-medium">{stats.clicheCount}</p>
          </div>
        </div>

        {/* Expandable recommendations */}
        {stats.recommendations.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-purple-400 hover:underline"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {stats.recommendations.length} рекомендаций
            </button>
            
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-1.5"
                >
                  {stats.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-xs"
                    >
                      <Sparkles className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                      <span className="flex-1">{rec}</span>
                      {onFix && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFix(rec)}
                          className="h-5 px-1.5 text-[10px]"
                        >
                          Исправить
                        </Button>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// ValidationMessage - For Suno V5 validation results
// ============================================
interface ValidationItem {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  fix?: string;
}

interface ValidationMessageProps {
  items: ValidationItem[];
  overallScore: number;
  onAutoFix?: () => void;
}

export function ValidationMessage({ items, overallScore, onAutoFix }: ValidationMessageProps) {
  const passCount = items.filter(i => i.status === 'pass').length;
  const warnCount = items.filter(i => i.status === 'warn').length;
  const failCount = items.filter(i => i.status === 'fail').length;

  const statusIcon = (status: ValidationItem['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'warn': return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'fail': return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-500/10 bg-emerald-500/10">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">Проверка Suno V5</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px] h-4 bg-emerald-500/20 text-emerald-400">
            ✓ {passCount}
          </Badge>
          {warnCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 bg-amber-500/20 text-amber-400">
              ⚠ {warnCount}
            </Badge>
          )}
          {failCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 bg-red-500/20 text-red-400">
              ✗ {failCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Validation items */}
      <div className="p-2 space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-2 p-2 rounded-lg text-xs",
              item.status === 'pass' && "bg-emerald-500/5",
              item.status === 'warn' && "bg-amber-500/10",
              item.status === 'fail' && "bg-red-500/10"
            )}
          >
            {statusIcon(item.status)}
            <div className="flex-1 min-w-0">
              <p className="font-medium">{item.label}</p>
              {item.message && (
                <p className="text-muted-foreground mt-0.5">{item.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Auto-fix button */}
      {(warnCount > 0 || failCount > 0) && onAutoFix && (
        <div className="px-3 pb-3">
          <Button
            onClick={onAutoFix}
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Автоисправление ({warnCount + failCount} проблем)
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// ProgressMessage - For showing AI processing steps
// ============================================
interface ProgressMessageProps {
  steps: { id: string; label: string; status: 'pending' | 'active' | 'done' }[];
  currentStep: string;
}

export function ProgressMessage({ steps, currentStep }: ProgressMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-3 p-3 rounded-lg border border-border/50 bg-muted/30"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
        <span className="text-xs font-medium">AI обрабатывает...</span>
      </div>

      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2"
          >
            {step.status === 'done' && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            {step.status === 'active' && (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            )}
            {step.status === 'pending' && (
              <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30" />
            )}
            <span className={cn(
              "text-xs",
              step.status === 'done' && "text-muted-foreground line-through",
              step.status === 'active' && "font-medium",
              step.status === 'pending' && "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
