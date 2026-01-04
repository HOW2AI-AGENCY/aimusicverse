/**
 * Tags Editor Component
 * Structured tag picker with Russian translations, hints, and English insertion
 */
import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  X, 
  Plus, 
  Tag, 
  Sparkles, 
  Check, 
  HelpCircle,
  Music,
  Heart,
  Mic,
  Guitar,
  Gauge,
  Sliders,
  LayoutList,
  Wand2,
  ChevronDown,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { 
  SUNO_TAG_CATEGORIES, 
  findSunoTag, 
  getTagLabel,
  type TagCategory,
  type SunoTag 
} from '@/lib/sunoTags';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Music,
  Heart,
  Mic,
  Guitar,
  Gauge,
  Sliders,
  LayoutList,
  Wand2,
};

interface TagsEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestedTags?: string[];
  maxTags?: number;
  className?: string;
  compact?: boolean;
}

export function TagsEditor({
  tags,
  onChange,
  suggestedTags = [],
  maxTags = 15,
  className,
  compact = false,
}: TagsEditorProps) {
  const [newTag, setNewTag] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddTag = useCallback((tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (!normalizedTag || tags.includes(normalizedTag) || tags.length >= maxTags) return;
    
    onChange([...tags, normalizedTag]);
    setNewTag('');
    hapticImpact('light');
  }, [tags, onChange, maxTags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
    hapticImpact('light');
  }, [tags, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag(newTag);
    }
  }, [newTag, handleAddTag]);

  // Filter tags by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return SUNO_TAG_CATEGORIES;
    
    const query = searchQuery.toLowerCase();
    return SUNO_TAG_CATEGORIES.map(cat => ({
      ...cat,
      tags: cat.tags.filter(tag => 
        tag.label.toLowerCase().includes(query) ||
        tag.value.toLowerCase().includes(query) ||
        tag.hint.toLowerCase().includes(query)
      )
    })).filter(cat => cat.tags.length > 0);
  }, [searchQuery]);

  // Get suggestions from AI
  const aiSuggestions = useMemo(() => {
    return suggestedTags
      .filter(t => !tags.includes(t.toLowerCase()))
      .slice(0, 8);
  }, [suggestedTags, tags]);

  // Get icon component for category
  const getCategoryIcon = (iconName: string) => {
    return CATEGORY_ICONS[iconName] || Tag;
  };

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const tagInfo = findSunoTag(tag);
            return (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 pr-1 hover:bg-destructive/20 transition-colors group"
              >
                <span className="text-xs">{tagInfo?.label || tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/30"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-6 text-xs px-2"
            onClick={() => setShowPicker(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Добавить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('space-y-3', className)}>
        {/* Current Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              Теги ({tags.length}/{maxTags})
            </label>
            {tags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() => onChange([])}
              >
                Очистить
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1.5 min-h-[32px]">
            <AnimatePresence mode="popLayout">
              {tags.map((tag) => {
                const tagInfo = findSunoTag(tag);
                return (
                  <motion.div
                    key={tag}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    layout
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="default"
                          className="gap-1 pr-1.5 cursor-pointer hover:bg-primary/80"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <span>{tagInfo?.label || tag}</span>
                          <span className="text-[10px] opacity-60">[{tag}]</span>
                          <X className="w-3 h-3 ml-0.5" />
                        </Badge>
                      </TooltipTrigger>
                      {tagInfo && (
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">{tagInfo.hint}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Вставляется как: [{tagInfo.value}]
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {tags.length === 0 && (
              <span className="text-sm text-muted-foreground">Нет тегов</span>
            )}
          </div>
        </div>

        {/* Add New Tag */}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Добавить тег вручную..."
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={() => handleAddTag(newTag)}
            disabled={!newTag.trim() || tags.length >= maxTags}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* AI Suggested Tags */}
        {aiSuggestions.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5 text-primary">
              <Sparkles className="w-4 h-4" />
              AI-предложения
            </label>
            <div className="flex flex-wrap gap-1.5">
              {aiSuggestions.map((tag) => {
                const tagInfo = findSunoTag(tag);
                return (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/20 border-primary/30"
                    onClick={() => handleAddTag(tag)}
                  >
                    + {tagInfo?.label || tag}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Structured Tag Picker */}
        <div className="space-y-2">
          <Button
            variant={showPicker ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowPicker(!showPicker)}
            className="gap-1.5 w-full justify-between"
          >
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Каталог тегов
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              showPicker && "rotate-180"
            )} />
          </Button>

          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border rounded-xl p-3 space-y-3 bg-muted/20">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск тегов..."
                      className="pl-8 h-9"
                    />
                  </div>

                  {/* Categories */}
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-1.5 pr-3">
                      {filteredCategories.map((category) => {
                        const Icon = getCategoryIcon(category.icon);
                        const isExpanded = expandedCategory === category.id || !!searchQuery;
                        const availableTags = category.tags.filter(t => !tags.includes(t.value.toLowerCase()));
                        
                        return (
                          <Collapsible
                            key={category.id}
                            open={isExpanded}
                            onOpenChange={() => {
                              setExpandedCategory(isExpanded ? null : category.id);
                            }}
                          >
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-between h-9 px-2"
                              >
                                <span className="flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-muted-foreground" />
                                  <span>{category.label}</span>
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {availableTags.length}
                                  </Badge>
                                </span>
                                <ChevronDown className={cn(
                                  "w-4 h-4 transition-transform",
                                  isExpanded && "rotate-180"
                                )} />
                              </Button>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <div className="flex flex-wrap gap-1.5 p-2 pt-1">
                                {availableTags.length === 0 ? (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Все теги добавлены
                                  </span>
                                ) : (
                                  availableTags.map((tag) => (
                                    <Tooltip key={tag.value}>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant="outline"
                                          className="cursor-pointer hover:bg-primary/20 transition-colors gap-1"
                                          onClick={() => handleAddTag(tag.value)}
                                        >
                                          <span>{tag.label}</span>
                                          <HelpCircle className="w-3 h-3 opacity-50" />
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        <p className="font-medium">{tag.label}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {tag.hint}
                                        </p>
                                        <p className="text-[10px] text-primary mt-1">
                                          → [{tag.value}]
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                      
                      {filteredCategories.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Ничего не найдено
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
}
