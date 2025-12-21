/**
 * SectionTagSelector - Popover for adding tags to lyrics sections
 * 
 * Features:
 * - Categorized tabs with icons
 * - Quick search
 * - V5 compound presets
 * - Already selected tags marked
 */

import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Mic, 
  Guitar, 
  Volume2, 
  Heart, 
  Sliders, 
  Layers,
  Zap,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  TAG_CATEGORIES, 
  SECTION_TAGS, 
  V5_COMPOUND_PRESETS,
  type TagCategory,
  type TagDefinition,
} from '@/lib/lyrics/constants';

// Icon map for categories
const CATEGORY_ICONS: Record<TagCategory | 'presets', React.ElementType> = {
  vocal: Mic,
  instrument: Guitar,
  dynamic: Volume2,
  mood: Heart,
  production: Sliders,
  structure: Layers,
  presets: Zap,
};

interface SectionTagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  trigger?: React.ReactNode;
  className?: string;
}

export function SectionTagSelector({ 
  selectedTags, 
  onTagsChange, 
  trigger,
  className 
}: SectionTagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TagCategory | 'presets'>('vocal');

  const filteredTags = useMemo(() => {
    if (!search) return SECTION_TAGS;
    const query = search.toLowerCase();
    return SECTION_TAGS.filter(
      tag => 
        tag.value.toLowerCase().includes(query) || 
        tag.labelRu.toLowerCase().includes(query)
    );
  }, [search]);

  const tagsByCategory = useMemo(() => {
    const result: Record<TagCategory, TagDefinition[]> = {
      vocal: [],
      instrument: [],
      dynamic: [],
      mood: [],
      production: [],
      structure: [],
    };
    
    filteredTags.forEach(tag => {
      result[tag.category].push(tag);
    });
    
    return result;
  }, [filteredTags]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const applyPreset = (presetTags: string[]) => {
    const newTags = [...new Set([...selectedTags, ...presetTags])];
    onTagsChange(newTags);
  };

  const categories: (TagCategory | 'presets')[] = [
    'vocal', 'instrument', 'dynamic', 'mood', 'production', 'structure', 'presets'
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6 rounded-full", className)}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* Search */}
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск тегов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Category tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TagCategory | 'presets')}>
          <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-none border-b border-border/50 flex-wrap justify-start gap-0.5">
            {categories.map(cat => {
              const Icon = CATEGORY_ICONS[cat];
              const info = cat === 'presets' 
                ? { label: 'Комбо', colorClass: 'bg-gradient-to-r from-pink-500 to-purple-500' }
                : TAG_CATEGORIES[cat];
              
              return (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="h-7 px-2 text-xs gap-1 data-[state=active]:bg-background"
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{info.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <ScrollArea className="h-[240px]">
            {/* Tag categories */}
            {(Object.keys(tagsByCategory) as TagCategory[]).map(category => (
              <TabsContent key={category} value={category} className="m-0 p-2">
                <div className="flex flex-wrap gap-1.5">
                  {tagsByCategory[category].map(tag => {
                    const isSelected = selectedTags.includes(tag.value);
                    const categoryInfo = TAG_CATEGORIES[category];
                    
                    return (
                      <Badge
                        key={tag.value}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all text-xs gap-1",
                          isSelected && cn(categoryInfo.colorClass, "text-white border-0"),
                          !isSelected && "hover:bg-muted"
                        )}
                        onClick={() => toggleTag(tag.value)}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{tag.value}</span>
                        <span className="text-[10px] opacity-70">({tag.labelRu})</span>
                      </Badge>
                    );
                  })}
                  {tagsByCategory[category].length === 0 && (
                    <p className="text-sm text-muted-foreground p-2">
                      Ничего не найдено
                    </p>
                  )}
                </div>
              </TabsContent>
            ))}

            {/* Presets tab */}
            <TabsContent value="presets" className="m-0 p-2 space-y-2">
              {V5_COMPOUND_PRESETS.map(preset => {
                const allSelected = preset.tags.every(t => selectedTags.includes(t));
                
                return (
                  <div
                    key={preset.id}
                    className={cn(
                      "p-2 rounded-lg border border-border/50 cursor-pointer transition-colors",
                      allSelected ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50"
                    )}
                    onClick={() => applyPreset(preset.tags)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-medium">{preset.label}</span>
                      {allSelected && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      {preset.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {preset.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer with selected count */}
        {selectedTags.length > 0 && (
          <div className="p-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Выбрано: {selectedTags.length}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => onTagsChange([])}
            >
              Очистить
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
