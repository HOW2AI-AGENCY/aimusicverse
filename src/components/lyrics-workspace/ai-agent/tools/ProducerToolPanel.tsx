/**
 * ProducerToolPanel - Professional producer review panel
 */

import { motion } from '@/lib/motion';
import { Headphones, X, FileText, Sparkles, Tag, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ToolPanelProps } from '../types';

export function ProducerToolPanel({ 
  context, 
  onExecute, 
  onClose, 
  isLoading,
}: ToolPanelProps) {
  const hasContent = !!(context.existingLyrics || context.selectedSection?.content);
  
  const handleReview = () => {
    onExecute({
      existingLyrics: context.existingLyrics,
      sectionContent: context.selectedSection?.content,
      sectionNotes: context.selectedSection?.notes,
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
      className="border-b border-border/50 bg-amber-500/5 max-h-[50vh] overflow-y-auto overscroll-contain"
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Продюсерский разбор</h3>
              <p className="text-[10px] text-muted-foreground">Профессиональные рекомендации</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!hasContent ? (
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Добавьте текст для разбора
            </p>
          </div>
        ) : (
          <>
            {/* Context Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="p-1 rounded bg-muted">
                  <FileText className="w-3 h-3" />
                </div>
                <span>Текст: <span className="font-medium text-foreground">{context.existingLyrics?.length || 0} симв.</span></span>
              </div>
              
              {context.stylePrompt && (
                <div className="flex items-start gap-2 text-xs">
                  <div className="p-1 rounded bg-muted shrink-0">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-muted-foreground">Style: </span>
                    <span className="font-medium text-amber-400">{context.stylePrompt.slice(0, 50)}...</span>
                  </div>
                </div>
              )}
              
              {context.globalTags && context.globalTags.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="p-1 rounded bg-muted">
                    <Tag className="w-3 h-3" />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {context.globalTags.slice(0, 4).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                    ))}
                    {context.globalTags.length > 4 && (
                      <Badge variant="outline" className="text-[10px]">+{context.globalTags.length - 4}</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* What will be analyzed */}
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-medium text-amber-400 mb-1.5">Что будет проанализировано:</p>
              <ul className="text-[10px] text-muted-foreground space-y-1">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  Коммерческий потенциал и хитовость
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  Вокальная карта с эффектами
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  Рекомендации по аранжировке
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  Оптимальный Style Prompt для Suno
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  Теги жанра и стиля
                </li>
              </ul>
            </div>

            {/* Execute Button */}
            <Button 
              onClick={handleReview}
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Headphones className="w-4 h-4 mr-2" />
              Получить рекомендации
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
