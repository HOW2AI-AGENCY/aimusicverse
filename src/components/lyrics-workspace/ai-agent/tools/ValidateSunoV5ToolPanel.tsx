/**
 * ValidateSunoV5ToolPanel - Deep validation panel for Suno V5 syntax
 * Checks tags, syllables, conflicts, structure, clichés
 */

import { useState, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { ShieldCheck, X, Sparkles, AlertTriangle, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ToolPanelProps } from '../types';
import { LyricsParser } from '@/lib/lyrics/LyricsParser';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  suggestion?: string;
}

export function ValidateSunoV5ToolPanel({ context, onExecute, onClose, isLoading }: ToolPanelProps) {
  const [hasValidated, setHasValidated] = useState(false);

  // Run local validation
  const localAnalysis = useMemo(() => {
    if (!context.existingLyrics) return null;
    return LyricsParser.professionalAnalysis(context.existingLyrics);
  }, [context.existingLyrics]);

  // Prepare validation issues from local analysis
  const validationIssues = useMemo((): ValidationIssue[] => {
    if (!localAnalysis) return [];
    
    const issues: ValidationIssue[] = [];

    // Check for missing [End]
    if (!context.existingLyrics?.includes('[End]')) {
      issues.push({
        type: 'error',
        message: 'Отсутствует тег [End]',
        suggestion: 'Добавьте [End] в конце текста, иначе песня может зациклиться'
      });
    }

    // Check for Russian tags
    const russianTagMatch = context.existingLyrics?.match(/\[(Куплет|Припев|Бридж|Интро|Аутро)[^\]]*\]/gi);
    if (russianTagMatch) {
      issues.push({
        type: 'error',
        message: `Русские теги запрещены: ${russianTagMatch.join(', ')}`,
        suggestion: 'Используйте [Verse], [Chorus], [Bridge], [Intro], [Outro]'
      });
    }

    // Check for clichés
    localAnalysis.cliches.forEach(cliche => {
      issues.push({
        type: 'warning',
        message: `Клише: "${cliche.cliche}"`,
        line: cliche.line,
        suggestion: cliche.suggestion
      });
    });

    // Check for overlong lines
    if (localAnalysis.syllableStats.overlong > 0) {
      issues.push({
        type: 'warning',
        message: `${localAnalysis.syllableStats.overlong} строк с избыточными слогами (>12)`,
        suggestion: 'Разбейте длинные строки запятыми или перенесите часть текста'
      });
    }

    // Check tag balance
    if (localAnalysis.tagBalance.structural === 0) {
      issues.push({
        type: 'error',
        message: 'Нет структурных тегов',
        suggestion: 'Добавьте [Verse], [Chorus], [Bridge] и другие'
      });
    }

    if (localAnalysis.tagBalance.vocal === 0) {
      issues.push({
        type: 'info',
        message: 'Нет вокальных тегов',
        suggestion: 'Добавьте [Male Vocal], [Female Vocal], [Whisper] и др.'
      });
    }

    if (localAnalysis.tagBalance.dynamic === 0) {
      issues.push({
        type: 'info',
        message: 'Нет динамических эффектов',
        suggestion: 'Добавьте [!crescendo], [!drop], [!build_up] для напряжения'
      });
    }

    // Check for quality
    if (localAnalysis.qualityScore < 50) {
      issues.push({
        type: 'warning',
        message: `Низкий показатель качества: ${localAnalysis.qualityScore}/100`,
        suggestion: 'Следуйте рекомендациям ниже для улучшения'
      });
    }

    return issues;
  }, [localAnalysis, context.existingLyrics]);

  const errorCount = validationIssues.filter(i => i.type === 'error').length;
  const warningCount = validationIssues.filter(i => i.type === 'warning').length;
  const infoCount = validationIssues.filter(i => i.type === 'info').length;

  const handleExecute = () => {
    setHasValidated(true);
    onExecute({
      lyrics: context.existingLyrics,
      requestDeepValidation: true,
    });
  };

  if (!context.existingLyrics) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="border-b border-border/50 bg-green-500/5 p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">Валидация Suno V5</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Нет текста для валидации. Сначала создайте или вставьте лирику.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border/50 bg-green-500/5 max-h-[70vh] overflow-hidden flex flex-col"
    >
      <div className="p-3 space-y-3 flex-1 overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Валидация Suno V5</h3>
              <p className="text-[10px] text-muted-foreground">Глубокая проверка синтаксиса и качества</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Quality Score */}
        {localAnalysis && (
          <div className="p-3 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Оценка качества
              </Label>
              <span className={cn(
                "text-lg font-bold",
                localAnalysis.qualityScore >= 80 ? "text-green-500" :
                localAnalysis.qualityScore >= 60 ? "text-yellow-500" :
                "text-red-500"
              )}>
                {localAnalysis.qualityScore}/100
              </span>
            </div>
            <Progress 
              value={localAnalysis.qualityScore} 
              className="h-2"
            />
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-1.5 bg-background/50 rounded">
                <p className="text-muted-foreground">Слогов (avg)</p>
                <p className="font-medium">{localAnalysis.syllableStats.average.toFixed(1)}</p>
              </div>
              <div className="text-center p-1.5 bg-background/50 rounded">
                <p className="text-muted-foreground">Оптимальных</p>
                <p className="font-medium text-green-500">{localAnalysis.syllableStats.optimal}</p>
              </div>
              <div className="text-center p-1.5 bg-background/50 rounded">
                <p className="text-muted-foreground">Длинных</p>
                <p className={cn("font-medium", localAnalysis.syllableStats.overlong > 0 && "text-yellow-500")}>
                  {localAnalysis.syllableStats.overlong}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Issues Summary */}
        <div className="flex gap-2">
          <Badge variant={errorCount > 0 ? "destructive" : "outline"} className="gap-1">
            <XCircle className="w-3 h-3" />
            {errorCount} ошибок
          </Badge>
          <Badge variant={warningCount > 0 ? "secondary" : "outline"} className="gap-1 bg-yellow-500/20 text-yellow-600">
            <AlertTriangle className="w-3 h-3" />
            {warningCount} предупр.
          </Badge>
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {infoCount} советов
          </Badge>
        </div>

        {/* Issues List */}
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-2">
            {validationIssues.map((issue, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-2 rounded-lg border text-xs",
                  issue.type === 'error' && "bg-red-500/10 border-red-500/30",
                  issue.type === 'warning' && "bg-yellow-500/10 border-yellow-500/30",
                  issue.type === 'info' && "bg-blue-500/10 border-blue-500/30"
                )}
              >
                <div className="flex items-start gap-2">
                  {issue.type === 'error' && <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />}
                  {issue.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />}
                  {issue.type === 'info' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="font-medium">{issue.message}</p>
                    {issue.line && <p className="text-muted-foreground">Строка: {issue.line}</p>}
                    {issue.suggestion && (
                      <p className="text-muted-foreground mt-1">💡 {issue.suggestion}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {validationIssues.length === 0 && (
              <div className="p-4 text-center text-green-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Все проверки пройдены!</p>
                <p className="text-xs text-muted-foreground">Текст соответствует Suno V5 синтаксису</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Tag Balance */}
        {localAnalysis && (
          <div className="p-2 bg-muted/30 rounded-lg">
            <Label className="text-xs text-muted-foreground mb-2 block">Баланс тегов</Label>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              <div className="text-center p-1.5 bg-background/50 rounded">
                <p className="text-muted-foreground text-[10px]">Структ.</p>
                <p className={cn("font-medium", localAnalysis.tagBalance.structural === 0 && "text-red-500")}>
                  {localAnalysis.tagBalance.structural}
                </p>
              </div>
              <div className="text-center p-1.5 bg-background/50 rounded">
                <p className="text-muted-foreground text-[10px]">Вокал</p>
                <p className="font-medium">{localAnalysis.tagBalance.vocal}</p>
              </div>
              <div className="text-center p-1.5 bg-background/50 rounded">
                <p className="text-muted-foreground text-[10px]">Динам.</p>
                <p className="font-medium">{localAnalysis.tagBalance.dynamic}</p>
              </div>
              <div className="text-center p-1.5 bg-background/50 rounded">
                <p className="text-muted-foreground text-[10px]">Инстр.</p>
                <p className="font-medium">{localAnalysis.tagBalance.instrumental}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {localAnalysis && localAnalysis.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs">Рекомендации</Label>
            <div className="space-y-1">
              {localAnalysis.recommendations.slice(0, 5).map((rec, idx) => (
                <p key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary">•</span>
                  {rec}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={isLoading}
          className="w-full gap-2 bg-green-500 hover:bg-green-600"
        >
          <Sparkles className="w-4 h-4" />
          {hasValidated ? 'Запустить AI валидацию' : 'Глубокая AI проверка'}
        </Button>
      </div>
    </motion.div>
  );
}
