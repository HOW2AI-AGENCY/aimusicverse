import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, Plus, X, Music2, Mic, Zap, Heart, Check } from 'lucide-react';
import { TagBadge } from '@/components/lyrics/shared/TagBadge';
import { cn } from '@/lib/utils';

// Predefined tag categories for quick selection
const TAG_CATEGORIES = {
  vocal: {
    label: 'Вокал',
    icon: <Mic className="h-3 w-3" />,
    tags: [
      'Male Vocal', 'Female Vocal', 'Duet', 'Choir',
      'Falsetto', 'Raspy Voice', 'Whisper', 'Belting',
      'Autotune', 'Harmonies', 'Ad-libs', 'Vocal Runs'
    ]
  },
  instrument: {
    label: 'Инструменты',
    icon: <Music2 className="h-3 w-3" />,
    tags: [
      'Piano', 'Acoustic Guitar', 'Electric Guitar', 'Bass',
      'Drums', '808s', 'Synth', 'Strings',
      'Brass', 'Violin', 'Saxophone', 'Flute'
    ]
  },
  dynamic: {
    label: 'Динамика',
    icon: <Zap className="h-3 w-3" />,
    tags: [
      'Soft Start', 'Build', 'Drop', 'Breakdown',
      'Crescendo', 'Decrescendo', 'Climax', 'Fade Out',
      'Sudden Stop', 'Tempo Change', 'Key Change'
    ]
  },
  emotional: {
    label: 'Эмоции',
    icon: <Heart className="h-3 w-3" />,
    tags: [
      'with passion', 'softly', 'powerfully', 'tenderly',
      'angrily', 'joyfully', 'sadly', 'desperately',
      'confidently', 'playfully', 'mysteriously', 'intensely'
    ]
  }
};

interface SectionTagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  sectionName?: string;
  compact?: boolean;
}

export function SectionTagSelector({ 
  selectedTags, 
  onChange, 
  sectionName = 'секции',
  compact = false 
}: SectionTagSelectorProps) {
  const [customTag, setCustomTag] = useState('');
  const [activeTab, setActiveTab] = useState('vocal');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      onChange([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  const clearAll = () => {
    onChange([]);
  };

  // Compact display for inline use
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {selectedTags.length > 0 ? (
          selectedTags.map(tag => (
            <TagBadge
              key={tag}
              tag={tag}
              size="sm"
              onRemove={() => removeTag(tag)}
            />
          ))
        ) : (
          <span className="text-xs text-muted-foreground/60 italic">
            Теги не добавлены
          </span>
        )}
        
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 gap-1"
            >
              <Plus className="h-3 w-3" />
              <span className="text-xs">Теги</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] max-h-[85vh] flex flex-col">
            <SheetHeader className="pb-3">
              <SheetTitle className="text-base">Теги для {sectionName}</SheetTitle>
              <SheetDescription className="text-xs">
                Добавьте теги для управления вокалом, инструментами и эмоциями
              </SheetDescription>
            </SheetHeader>
            
            <TagSelectorContent
              selectedTags={selectedTags}
              toggleTag={toggleTag}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              customTag={customTag}
              setCustomTag={setCustomTag}
              addCustomTag={addCustomTag}
              clearAll={clearAll}
            />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Full display
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Tag className="h-3 w-3" />
          Теги секции
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="text-xs h-5">
              {selectedTags.length}
            </Badge>
          )}
        </Label>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-6 text-xs px-2"
          >
            Очистить
          </Button>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-lg border border-border/30">
          {selectedTags.map(tag => (
            <Badge 
              key={tag} 
              variant="default" 
              className="text-xs h-6 gap-1 pr-1 cursor-pointer"
              onClick={() => removeTag(tag)}
            >
              {tag}
              <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
        </div>
      )}

      {/* Quick Add Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-8 grid grid-cols-4 gap-1 p-0.5">
          {Object.entries(TAG_CATEGORIES).map(([key, category]) => (
            <TabsTrigger 
              key={key} 
              value={key} 
              className="text-xs px-1 gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category.icon}
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="h-[120px] mt-2">
          {Object.entries(TAG_CATEGORIES).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-0">
              <div className="flex flex-wrap gap-1.5">
                {category.tags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all text-xs h-7',
                        !isSelected && 'hover:bg-primary/10 hover:border-primary/30'
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 mr-1" />}
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>

      {/* Custom Tag Input */}
      <div className="flex gap-1.5">
        <Input
          placeholder="Свой тег..."
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
          className="h-8 text-xs"
        />
        <Button
          size="sm"
          onClick={addCustomTag}
          disabled={!customTag.trim()}
          className="h-8 px-3"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Shared content component for sheet
function TagSelectorContent({
  selectedTags,
  toggleTag,
  activeTab,
  setActiveTab,
  customTag,
  setCustomTag,
  addCustomTag,
  clearAll,
}: {
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  customTag: string;
  setCustomTag: (tag: string) => void;
  addCustomTag: () => void;
  clearAll: () => void;
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="pb-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-muted-foreground">
              Выбрано: {selectedTags.length}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-6 text-xs px-2"
            >
              Очистить
            </Button>
          </div>
          <ScrollArea className="max-h-20">
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="default" 
                  className="text-xs h-6 gap-1 pr-1"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  <X className="h-2.5 w-2.5" />
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 mt-3">
        <TabsList className="w-full h-9 grid grid-cols-4 gap-1 shrink-0">
          {Object.entries(TAG_CATEGORIES).map(([key, category]) => (
            <TabsTrigger 
              key={key} 
              value={key} 
              className="text-xs gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category.icon}
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="flex-1 mt-3">
          {Object.entries(TAG_CATEGORIES).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-0 pb-20">
              <div className="flex flex-wrap gap-2">
                {category.tags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all text-sm h-9 px-3',
                        !isSelected && 'hover:bg-primary/10 hover:border-primary/30'
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      {isSelected && <Check className="h-3 w-3 mr-1.5" />}
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>

      {/* Custom Tag Input - Fixed at bottom */}
      <div className="pt-3 border-t mt-auto shrink-0 safe-area-bottom">
        <Label className="text-xs mb-2 block">Добавить свой тег</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Введите тег..."
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
            className="h-10 text-sm"
          />
          <Button
            size="default"
            onClick={addCustomTag}
            disabled={!customTag.trim()}
            className="h-10 px-4 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
