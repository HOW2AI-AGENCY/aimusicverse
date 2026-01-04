/**
 * OptimizeToolPanel - Suno optimization panel
 */

import { motion } from '@/lib/motion';
import { Wand2, X, AlertTriangle, CheckCircle2, FileText, Tag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ToolPanelProps } from '../types';
import { useState } from 'react';

const OPTIMIZE_OPTIONS = [
  { id: 'text', label: 'Оптимизировать текст', desc: 'Сократить длинные строки, улучшить для пения' },
  { id: 'tags', label: 'Оптимизировать теги', desc: 'Добавить недостающие, убрать лишние' },
  { id: 'style', label: 'Улучшить Style Prompt', desc: 'Сгенерировать оптимальный промпт' },
];

export function OptimizeToolPanel({ 
  context, 
  onExecute, 
  onClose, 
  isLoading,
}: ToolPanelProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['text', 'tags', 'style']);
  
  const hasContent = !!(context.existingLyrics || context.selectedSection?.content);
  const textLength = context.existingLyrics?.length || 0;
  const hasIssues = textLength > 3000 || (context.globalTags?.length || 0) === 0;
  
  const toggleOption = (id: string) => {
    setSelectedOptions(prev => 
      prev.includes(id) 
        ? prev.filter(o => o !== id)
        : [...prev, id]
    );
  };

  const handleOptimize = () => {
    onExecute({
      optimizeTypes: selectedOptions,
      existingLyrics: context.existingLyrics,
      sectionContent: context.selectedSection?.content,
      allSectionNotes: context.allSectionNotes,
      stylePrompt: context.stylePrompt,
      title: context.title,
      genre: context.genre,
      mood: context.mood,
      globalTags: context.globalTags,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border/50 bg-primary/5 max-h-[50vh] overflow-y-auto overscroll-contain"
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Подготовка к Suno</h3>
              <p className="text-[10px] text-muted-foreground">Оптимизация для генерации</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!hasContent ? (
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Добавьте текст для оптимизации
            </p>
          </div>
        ) : (
          <>
            {/* Status Indicators */}
            <div className="space-y-2">
              <div className={cn(
                "flex items-center gap-2 text-xs p-2 rounded-lg",
                textLength > 3000 
                  ? "bg-destructive/10 text-destructive" 
                  : "bg-green-500/10 text-green-500"
              )}>
                {textLength > 3000 ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Длина текста: {textLength} / 3000 симв.</span>
              </div>
              
              <div className={cn(
                "flex items-center gap-2 text-xs p-2 rounded-lg",
                (context.globalTags?.length || 0) === 0
                  ? "bg-amber-500/10 text-amber-500" 
                  : "bg-green-500/10 text-green-500"
              )}>
                {(context.globalTags?.length || 0) === 0 ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Теги: {context.globalTags?.length || 0} шт.</span>
              </div>
              
              <div className={cn(
                "flex items-center gap-2 text-xs p-2 rounded-lg",
                !context.stylePrompt
                  ? "bg-amber-500/10 text-amber-500" 
                  : "bg-green-500/10 text-green-500"
              )}>
                {!context.stylePrompt ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Style Prompt: {context.stylePrompt ? 'Задан' : 'Не задан'}</span>
              </div>
            </div>

            {/* Optimize Options */}
            <div className="space-y-2">
              {OPTIMIZE_OPTIONS.map((option) => {
                const isSelected = selectedOptions.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleOption(option.id)}
                    className={cn(
                      "w-full p-2.5 rounded-lg border text-left transition-all flex items-start gap-3",
                      isSelected 
                        ? "border-primary/50 bg-primary/10" 
                        : "border-border/50 hover:bg-muted/50",
                      "disabled:opacity-50"
                    )}
                    disabled={isLoading}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-[10px] text-muted-foreground">{option.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Execute Button */}
            <Button 
              onClick={handleOptimize}
              disabled={isLoading || selectedOptions.length === 0}
              className="w-full"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Оптимизировать
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
