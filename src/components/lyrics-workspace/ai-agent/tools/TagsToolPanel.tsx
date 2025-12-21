/**
 * TagsToolPanel - Panel for tag generation and selection
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { Tag, Sparkles, X, Mic2, Zap, Music2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ToolPanelProps } from '../types';
import { TAG_CATEGORIES } from '../constants';

export function TagsToolPanel({ context, onExecute, onClose, isLoading }: ToolPanelProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(context.globalTags || []);
  const [activeTab, setActiveTab] = useState('vocal');

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAutoGenerate = () => {
    onExecute({
      existingLyrics: context.existingLyrics,
      selectedTags,
    });
  };

  const handleApplySelected = () => {
    onExecute({
      tags: selectedTags,
      directApply: true,
    });
  };

  const categoryIcons = {
    vocal: Mic2,
    dynamics: Zap,
    instruments: Music2,
    mood: Target,
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border/50 bg-green-500/5 max-h-[50vh] overflow-y-auto overscroll-contain"
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Tag className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Теги Suno V5</h3>
              <p className="text-[10px] text-muted-foreground">Выберите или сгенерируйте</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Выбрано: {selectedTags.length}</p>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="text-xs cursor-pointer hover:bg-destructive"
                  onClick={() => toggleTag(tag)}
                >
                  [{tag}] ×
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 h-9">
            {Object.entries(TAG_CATEGORIES).map(([key, category]) => {
              const Icon = categoryIcons[key as keyof typeof categoryIcons];
              return (
                <TabsTrigger key={key} value={key} className="text-xs gap-1 px-2">
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(TAG_CATEGORIES).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-2">
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {category.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all text-xs",
                      selectedTags.includes(tag) && "bg-green-500"
                    )}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleAutoGenerate}
            disabled={isLoading || !context.existingLyrics}
            className="flex-1 gap-2 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI подбор
          </Button>
          <Button
            onClick={handleApplySelected}
            disabled={selectedTags.length === 0}
            className="flex-1 gap-2 text-xs"
          >
            <Tag className="w-3.5 h-3.5" />
            Применить
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
