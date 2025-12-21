/**
 * AnalyzeToolPanel - Panel for comprehensive lyrics analysis
 */

import { motion } from '@/lib/motion';
import { BarChart3, X, FileText, Music2, Mic2, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ToolPanelProps } from '../types';
import { useState } from 'react';

const ANALYSIS_OPTIONS = [
  { id: 'meaning', label: 'Смысл', desc: 'Тема, эмоции, история', icon: FileText },
  { id: 'rhythm', label: 'Ритм', desc: 'Слоги, ударения', icon: Music2 },
  { id: 'rhymes', label: 'Рифмы', desc: 'Схема, качество', icon: Mic2 },
  { id: 'structure', label: 'Структура', desc: 'Теги, баланс', icon: LayoutGrid },
];

export function AnalyzeToolPanel({ 
  context, 
  onExecute, 
  onClose, 
  isLoading,
}: ToolPanelProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['meaning', 'rhythm', 'rhymes', 'structure']);
  
  const hasContent = !!(context.existingLyrics || context.selectedSection?.content);
  
  const toggleOption = (id: string) => {
    setSelectedOptions(prev => 
      prev.includes(id) 
        ? prev.filter(o => o !== id)
        : [...prev, id]
    );
  };

  const handleAnalyze = () => {
    onExecute({
      analysisTypes: selectedOptions,
      existingLyrics: context.existingLyrics,
      sectionContent: context.selectedSection?.content,
      sectionNotes: context.selectedSection?.notes,
      allSectionNotes: context.allSectionNotes,
      stylePrompt: context.stylePrompt,
      title: context.title,
      genre: context.genre,
      mood: context.mood,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border/50 bg-purple-500/5 max-h-[50vh] overflow-y-auto overscroll-contain"
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Анализ текста</h3>
              <p className="text-[10px] text-muted-foreground">Смысл, ритм, рифмы, структура</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!hasContent ? (
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Добавьте текст для анализа
            </p>
          </div>
        ) : (
          <>
            {/* Context Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="p-1 rounded bg-muted">
                <FileText className="w-3 h-3" />
              </div>
              {context.selectedSection ? (
                <span>Анализ секции: <span className="font-medium text-foreground">{context.selectedSection.type}</span></span>
              ) : (
                <span>Анализ всего текста: <span className="font-medium text-foreground">{context.existingLyrics?.length || 0} симв.</span></span>
              )}
              {context.allSectionNotes && context.allSectionNotes.length > 0 && (
                <span className="text-purple-400">+ {context.allSectionNotes.length} заметок</span>
              )}
            </div>

            {/* Analysis Options */}
            <div className="grid grid-cols-2 gap-2">
              {ANALYSIS_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedOptions.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleOption(option.id)}
                    className={cn(
                      "p-2.5 rounded-lg border text-left transition-all relative",
                      isSelected 
                        ? "border-purple-500/50 bg-purple-500/10" 
                        : "border-border/50 hover:bg-muted/50",
                      "disabled:opacity-50"
                    )}
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", isSelected ? "text-purple-400" : "text-muted-foreground")} />
                      <p className="text-sm font-medium">{option.label}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{option.desc}</p>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-purple-400 absolute top-2 right-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Execute Button */}
            <Button 
              onClick={handleAnalyze}
              disabled={isLoading || selectedOptions.length === 0}
              className="w-full bg-purple-500 hover:bg-purple-600"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Анализировать
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
