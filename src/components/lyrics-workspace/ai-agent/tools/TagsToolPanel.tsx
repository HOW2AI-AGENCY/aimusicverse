/**
 * TagsToolPanel - Enhanced panel for tag generation with visual builder
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Tag, Sparkles, X, Mic2, Zap, Music2, Target, Search, 
  Plus, Eye, AlertTriangle, CheckCircle2, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { ToolPanelProps } from '../types';
import { TAG_CATEGORIES } from '../constants';

// Tag conflict detection
const TAG_CONFLICTS: Record<string, string[]> = {
  'Male Vocal': ['Female Vocal'],
  'Female Vocal': ['Male Vocal'],
  'Whisper': ['Shout', 'Belt'],
  'Shout': ['Whisper', 'Breathy'],
  'Belt': ['Whisper'],
  'Slow': ['Fast', 'Uptempo'],
  'Fast': ['Slow'],
  'Uptempo': ['Slow'],
  'Lo-Fi': ['Hi-Fi', 'Crystal Clear'],
  'Acoustic': ['Electronic', 'Synth'],
  'Electronic': ['Acoustic'],
};

export function TagsToolPanel({ context, onExecute, onClose, isLoading }: ToolPanelProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(context.globalTags || []);
  const [activeTab, setActiveTab] = useState('builder');
  const [searchQuery, setSearchQuery] = useState('');

  // Detect conflicts in selected tags
  const conflicts = useMemo(() => {
    const found: { tag: string; conflictsWith: string }[] = [];
    selectedTags.forEach(tag => {
      const conflicting = TAG_CONFLICTS[tag];
      if (conflicting) {
        conflicting.forEach(conflict => {
          if (selectedTags.includes(conflict)) {
            found.push({ tag, conflictsWith: conflict });
          }
        });
      }
    });
    return found;
  }, [selectedTags]);

  // Filter tags by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return TAG_CATEGORIES;
    
    const query = searchQuery.toLowerCase();
    const filtered: Partial<typeof TAG_CATEGORIES> = {};
    
    (Object.entries(TAG_CATEGORIES) as [keyof typeof TAG_CATEGORIES, typeof TAG_CATEGORIES[keyof typeof TAG_CATEGORIES]][]).forEach(([key, category]) => {
      const matchingTags = category.tags.filter(tag => 
        tag.toLowerCase().includes(query)
      );
      if (matchingTags.length > 0) {
        filtered[key] = { ...category, tags: matchingTags };
      }
    });
    
    return filtered as typeof TAG_CATEGORIES;
  }, [searchQuery]);

  const toggleTag = (tag: string) => {
    hapticImpact('light');
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAutoGenerate = () => {
    hapticImpact('medium');
    onExecute({
      existingLyrics: context.existingLyrics,
      selectedTags,
    });
  };

  const handleApplySelected = () => {
    hapticImpact('medium');
    onExecute({
      tags: selectedTags,
      directApply: true,
    });
  };

  const clearAllTags = () => {
    hapticImpact('light');
    setSelectedTags([]);
  };

  // Generate preview string
  const previewString = useMemo(() => {
    if (selectedTags.length === 0) return '';
    if (selectedTags.length <= 3) {
      return `[${selectedTags.join(' | ')}]`;
    }
    return `[${selectedTags.slice(0, 2).join(' | ')} | ...+${selectedTags.length - 2}]`;
  }, [selectedTags]);

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
      className="border-b border-border/50 bg-emerald-500/5 max-h-[60vh] overflow-y-auto overscroll-contain"
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Tag className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Теги Suno V5</h3>
              <p className="text-[10px] text-muted-foreground">Визуальный конструктор тегов</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Preview - always visible */}
        {selectedTags.length > 0 && (
          <div className="p-2.5 rounded-lg bg-muted/50 border border-border/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Превью</span>
                <Badge variant="secondary" className="text-[10px] h-4">
                  {selectedTags.length} тегов
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllTags}
                className="h-5 px-1.5 gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span className="text-[10px]">Очистить</span>
              </Button>
            </div>
            
            <code className="block text-xs font-mono text-emerald-400 break-all">
              {previewString}
            </code>

            {/* Conflict warnings */}
            {conflicts.length > 0 && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-amber-400">
                  <p className="font-medium">Конфликт тегов:</p>
                  {conflicts.slice(0, 2).map((c, i) => (
                    <p key={i}>{c.tag} ⚡ {c.conflictsWith}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs: Builder vs Browse */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 h-8">
            <TabsTrigger value="builder" className="text-xs gap-1.5">
              <Plus className="w-3 h-3" />
              Конструктор
            </TabsTrigger>
            <TabsTrigger value="browse" className="text-xs gap-1.5">
              <Search className="w-3 h-3" />
              Поиск
            </TabsTrigger>
          </TabsList>

          {/* Builder tab - category cards */}
          <TabsContent value="builder" className="mt-2 space-y-2">
            {Object.entries(TAG_CATEGORIES).map(([key, category]) => {
              const Icon = categoryIcons[key as keyof typeof categoryIcons];
              const categorySelected = category.tags.filter(t => selectedTags.includes(t));
              
              return (
                <div key={key} className="rounded-lg border border-border/30 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{category.name}</span>
                    </div>
                    {categorySelected.length > 0 && (
                      <Badge variant="default" className="text-[10px] h-4 bg-emerald-500">
                        {categorySelected.length}
                      </Badge>
                    )}
                  </div>
                  <div className="p-2 flex flex-wrap gap-1.5">
                    {category.tags.slice(0, 12).map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all text-[10px] h-5",
                          selectedTags.includes(tag) && "bg-emerald-500 hover:bg-emerald-600",
                          conflicts.some(c => c.tag === tag || c.conflictsWith === tag) && 
                            "border-amber-500 bg-amber-500/20"
                        )}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {category.tags.length > 12 && (
                      <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">
                        +{category.tags.length - 12}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Browse tab - search all tags */}
          <TabsContent value="browse" className="mt-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Поиск тегов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="max-h-40 overflow-y-auto">
              {Object.entries(filteredCategories).length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-1">
                  {Object.entries(filteredCategories).flatMap(([key, category]) =>
                    category.tags.map((tag) => (
                      <Badge
                        key={`${key}-${tag}`}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all text-[10px] h-5",
                          selectedTags.includes(tag) && "bg-emerald-500"
                        )}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Ничего не найдено
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            onClick={handleAutoGenerate}
            disabled={isLoading || !context.existingLyrics}
            className="flex-1 gap-2 h-9"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs">AI подбор</span>
          </Button>
          <Button
            onClick={handleApplySelected}
            disabled={selectedTags.length === 0 || conflicts.length > 0}
            className="flex-1 gap-2 h-9"
          >
            {conflicts.length > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span className="text-xs">Применить</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
