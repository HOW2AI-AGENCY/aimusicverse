/**
 * AnalysisToolPanel - Panel for rhythm and structure analysis
 */

import { motion } from '@/lib/motion';
import { Music2, X, LayoutGrid, Mic2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ToolPanelProps, AIToolId } from '../types';

interface AnalysisToolPanelProps extends ToolPanelProps {
  toolId: 'rhythm' | 'structure';
}

const ANALYSIS_TYPES = {
  rhythm: {
    title: 'Анализ ритма',
    description: 'Проверка слоговой структуры и ударений',
    icon: Music2,
    color: 'orange',
    options: [
      { id: 'full', label: 'Полный анализ', desc: 'Слоги, ударения, паузы' },
      { id: 'syllables', label: 'Только слоги', desc: 'Подсчёт слогов в строках' },
      { id: 'stress', label: 'Ударения', desc: 'Схема ударений' },
    ]
  },
  structure: {
    title: 'Анализ структуры',
    description: 'Проверка композиции и секций',
    icon: LayoutGrid,
    color: 'purple',
    options: [
      { id: 'full', label: 'Полный анализ', desc: 'Структура + рекомендации' },
      { id: 'sections', label: 'Только секции', desc: 'Разбивка на части' },
      { id: 'suggest', label: 'Предложить структуру', desc: 'AI рекомендации' },
    ]
  }
};

export function AnalysisToolPanel({ 
  context, 
  onExecute, 
  onClose, 
  isLoading,
  toolId 
}: AnalysisToolPanelProps) {
  const config = ANALYSIS_TYPES[toolId];
  const Icon = config.icon;
  const colorClass = `${config.color}-500`;

  const handleAnalyze = (optionId: string) => {
    onExecute({
      analysisType: optionId,
      existingLyrics: context.existingLyrics,
      sectionContent: context.selectedSection?.content,
    });
  };

  const hasContent = !!(context.existingLyrics || context.selectedSection?.content);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn("border-b border-border/50", `bg-${config.color}-500/5`)}
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              `bg-${config.color}-500/20`
            )}>
              <Icon className={cn("w-4 h-4", `text-${config.color}-400`)} />
            </div>
            <div>
              <h3 className="text-sm font-medium">{config.title}</h3>
              <p className="text-[10px] text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content Check */}
        {!hasContent ? (
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Добавьте текст или выберите секцию для анализа
            </p>
          </div>
        ) : (
          <>
            {/* Context Indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="p-1 rounded bg-muted">
                <Music2 className="w-3 h-3" />
              </div>
              {context.selectedSection ? (
                <span>Анализ секции: <span className="font-medium text-foreground">{context.selectedSection.type}</span></span>
              ) : (
                <span>Анализ всего текста: <span className="font-medium text-foreground">{context.existingLyrics?.length || 0} симв.</span></span>
              )}
            </div>

            {/* Analysis Options */}
            <div className="grid gap-2">
              {config.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAnalyze(option.id)}
                  disabled={isLoading}
                  className={cn(
                    "p-2.5 rounded-lg border text-left transition-all",
                    "border-border/50 hover:bg-muted/50 hover:border-primary/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-[10px] text-muted-foreground">{option.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
