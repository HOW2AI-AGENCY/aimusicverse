/**
 * Style Preset Selector - Quick access to saved style presets (aromas)
 */

import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Palette, Sparkles, Music, Check, TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import { useSavedStylePresets } from '@/hooks/usePromptHistorySync';
import { QUICK_MIX_PRESETS, GENRE_PRESETS, MOOD_PRESETS } from '@/lib/prompt-dj-presets';

interface StylePresetSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (style: string, tags?: string[]) => void;
  currentStyle?: string;
}

export function StylePresetSelector({
  open,
  onOpenChange,
  onSelect,
  currentStyle,
}: StylePresetSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'quick' | 'genres' | 'saved'>('quick');
  const { presets: savedPresets, isLoading } = useSavedStylePresets();

  const filteredQuickMixes = useMemo(() => {
    if (!searchQuery) return QUICK_MIX_PRESETS;
    const query = searchQuery.toLowerCase();
    return QUICK_MIX_PRESETS.filter(
      p => p.label.toLowerCase().includes(query) ||
           p.genreA?.toLowerCase().includes(query) ||
           p.mood?.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredGenres = useMemo(() => {
    if (!searchQuery) return GENRE_PRESETS;
    const query = searchQuery.toLowerCase();
    return GENRE_PRESETS.filter(p => p.label.toLowerCase().includes(query));
  }, [searchQuery]);

  const filteredSaved = useMemo(() => {
    if (!searchQuery) return savedPresets;
    const query = searchQuery.toLowerCase();
    return savedPresets.filter(
      (p: any) => p.name?.toLowerCase().includes(query) ||
           p.template_text?.toLowerCase().includes(query)
    );
  }, [searchQuery, savedPresets]);

  const handleQuickMixSelect = (preset: typeof QUICK_MIX_PRESETS[0]) => {
    const styleParts: string[] = [];
    if (preset.genreA) styleParts.push(preset.genreA);
    if (preset.genreB) styleParts.push(preset.genreB);
    if (preset.mood) {
      const moodPreset = MOOD_PRESETS.find(m => m.id === preset.mood);
      if (moodPreset) styleParts.push(moodPreset.label);
    }
    if (preset.style) styleParts.push(preset.style);
    if (preset.bpm) styleParts.push(`${preset.bpm} BPM`);
    if (preset.instruments?.length) {
      styleParts.push(preset.instruments.join(', '));
    }
    
    const style = styleParts.join(', ');
    onSelect(style, preset.instruments);
    onOpenChange(false);
  };

  const handleGenreSelect = (genre: typeof GENRE_PRESETS[0]) => {
    onSelect(genre.label);
    onOpenChange(false);
  };

  const handleSavedSelect = (preset: any) => {
    onSelect(preset.template_text, preset.tags);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[75vh] flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Стили и ароматы
          </SheetTitle>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex gap-2 mt-3 shrink-0">
          <Button
            variant={activeTab === 'quick' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('quick')}
            className="flex-1 gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Быстрые
          </Button>
          <Button
            variant={activeTab === 'genres' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('genres')}
            className="flex-1 gap-1.5"
          >
            <Music className="w-3.5 h-3.5" />
            Жанры
          </Button>
          <Button
            variant={activeTab === 'saved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('saved')}
            className="flex-1 gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Мои
            {savedPresets.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {savedPresets.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-3 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск стилей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 mt-3">
          {activeTab === 'quick' && (
            <div className="grid grid-cols-2 gap-2 pb-4">
              {filteredQuickMixes.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleQuickMixSelect(preset)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    "hover:border-primary/50 hover:bg-accent/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{preset.emoji}</span>
                    <span className="text-sm font-medium">{preset.label}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {preset.bpm && (
                      <Badge variant="outline" className="text-[10px] h-4">
                        {preset.bpm} BPM
                      </Badge>
                    )}
                    {preset.mood && (
                      <Badge variant="secondary" className="text-[10px] h-4">
                        {MOOD_PRESETS.find(m => m.id === preset.mood)?.label || preset.mood}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'genres' && (
            <div className="grid grid-cols-3 gap-2 pb-4">
              {filteredGenres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreSelect(genre)}
                  className={cn(
                    "p-2.5 rounded-xl border text-center transition-all",
                    "hover:border-primary/50 hover:bg-accent/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    currentStyle?.toLowerCase().includes(genre.label.toLowerCase()) &&
                      "border-primary bg-primary/10"
                  )}
                >
                  <p className="text-xs font-medium">{genre.label}</p>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-2 pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredSaved.length === 0 ? (
                <EmptyState
                  icon={Palette}
                  title={searchQuery ? 'Ничего не найдено' : 'Нет сохранённых стилей'}
                  description="Сохраняйте любимые стили при генерации для быстрого доступа"
                  variant="compact"
                  animated={false}
                />
              ) : (
                filteredSaved.map((preset: any) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSavedSelect(preset)}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left transition-all",
                      "hover:border-primary/50 hover:bg-accent/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{preset.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {preset.template_text}
                        </p>
                      </div>
                      {preset.usage_count > 0 && (
                        <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                          {preset.usage_count}×
                        </Badge>
                      )}
                    </div>
                    {preset.tags?.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {preset.tags.slice(0, 3).map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px] h-4">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
