import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Mic, Guitar, Zap, Heart } from 'lucide-react';
import { useLyricsWizardStore } from '@/stores/lyricsWizardStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface TagCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  tags: string[];
  selected: string[];
  setSelected: (tags: string[]) => void;
}

const VOCAL_TAGS = [
  'Male Vocal', 'Female Vocal', 'Duet', 'Choir',
  'Falsetto', 'Raspy Voice', 'Whisper', 'Belting',
  'Autotune', 'Harmonies', 'Ad-libs', 'Vocal Runs'
];

const INSTRUMENT_TAGS = [
  'Piano', 'Acoustic Guitar', 'Electric Guitar', 'Bass',
  'Drums', '808s', 'Synth', 'Strings',
  'Brass', 'Violin', 'Saxophone', 'Flute'
];

const DYNAMIC_TAGS = [
  'Soft Start', 'Build', 'Drop', 'Breakdown',
  'Crescendo', 'Decrescendo', 'Climax', 'Fade Out',
  'Sudden Stop', 'Tempo Change', 'Key Change'
];

const EMOTIONAL_CUES = [
  'with passion', 'softly', 'powerfully', 'tenderly',
  'angrily', 'joyfully', 'sadly', 'desperately',
  'confidently', 'playfully', 'mysteriously', 'intensely'
];

export function EnrichmentStep() {
  const {
    concept,
    writing,
    enrichment,
    setVocalTags,
    setInstrumentTags,
    setDynamicTags,
    setEmotionalCues,
    isGenerating,
    setIsGenerating,
  } = useLyricsWizardStore();
  
  const [suggestedTags, setSuggestedTags] = useState<{
    vocal: string[];
    instrument: string[];
    dynamic: string[];
    emotional: string[];
  }>({ vocal: [], instrument: [], dynamic: [], emotional: [] });

  const categories: TagCategory[] = [
    {
      id: 'vocal',
      name: 'Вокал',
      icon: <Mic className="h-4 w-4" />,
      tags: VOCAL_TAGS,
      selected: enrichment.vocalTags,
      setSelected: setVocalTags,
    },
    {
      id: 'instrument',
      name: 'Инструменты',
      icon: <Guitar className="h-4 w-4" />,
      tags: INSTRUMENT_TAGS,
      selected: enrichment.instrumentTags,
      setSelected: setInstrumentTags,
    },
    {
      id: 'dynamic',
      name: 'Динамика',
      icon: <Zap className="h-4 w-4" />,
      tags: DYNAMIC_TAGS,
      selected: enrichment.dynamicTags,
      setSelected: setDynamicTags,
    },
    {
      id: 'emotional',
      name: 'Эмоции',
      icon: <Heart className="h-4 w-4" />,
      tags: EMOTIONAL_CUES,
      selected: enrichment.emotionalCues,
      setSelected: setEmotionalCues,
    },
  ];

  const toggleTag = (category: TagCategory, tag: string) => {
    if (category.selected.includes(tag)) {
      category.setSelected(category.selected.filter(t => t !== tag));
    } else {
      category.setSelected([...category.selected, tag]);
    }
  };

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const lyricsText = writing.sections
        .filter(s => s.content)
        .map(s => `[${s.name}]\n${s.content}`)
        .join('\n\n');

      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'analyze_lyrics',
          lyrics: lyricsText,
          genre: concept.genre || 'pop',
          mood: concept.mood.join(', ') || 'romantic',
          language: concept.language,
        },
      });

      if (error) throw error;
      
      if (data?.lyrics) {
        // Parse AI suggestions
        const response = data.lyrics.toLowerCase();
        
        const suggestVocal = VOCAL_TAGS.filter(tag => 
          response.includes(tag.toLowerCase())
        );
        const suggestInstrument = INSTRUMENT_TAGS.filter(tag => 
          response.includes(tag.toLowerCase())
        );
        const suggestDynamic = DYNAMIC_TAGS.filter(tag => 
          response.includes(tag.toLowerCase())
        );
        const suggestEmotional = EMOTIONAL_CUES.filter(tag => 
          response.includes(tag.toLowerCase())
        );

        setSuggestedTags({
          vocal: suggestVocal,
          instrument: suggestInstrument,
          dynamic: suggestDynamic,
          emotional: suggestEmotional,
        });

        toast.success('Теги проанализированы');
      }
    } catch (err) {
      logger.error('Error analyzing lyrics', { error: err });
      toast.error('Не удалось проанализировать текст');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyAllSuggestions = () => {
    if (suggestedTags.vocal.length) setVocalTags([...new Set([...enrichment.vocalTags, ...suggestedTags.vocal])]);
    if (suggestedTags.instrument.length) setInstrumentTags([...new Set([...enrichment.instrumentTags, ...suggestedTags.instrument])]);
    if (suggestedTags.dynamic.length) setDynamicTags([...new Set([...enrichment.dynamicTags, ...suggestedTags.dynamic])]);
    if (suggestedTags.emotional.length) setEmotionalCues([...new Set([...enrichment.emotionalCues, ...suggestedTags.emotional])]);
    toast.success('Теги применены');
  };

  const getSuggestedForCategory = (categoryId: string): string[] => {
    switch (categoryId) {
      case 'vocal': return suggestedTags.vocal;
      case 'instrument': return suggestedTags.instrument;
      case 'dynamic': return suggestedTags.dynamic;
      case 'emotional': return suggestedTags.emotional;
      default: return [];
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Label className="text-sm">Обогащение мета-тегами</Label>
            <p className="text-xs text-muted-foreground">
              Добавьте теги для улучшения генерации
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={generateSuggestions}
            disabled={isGenerating || writing.sections.every(s => !s.content)}
            className="gap-1 h-8 text-xs"
          >
            <Sparkles className="h-3 w-3" />
            {isGenerating ? 'Анализ...' : 'Подобрать AI'}
          </Button>
          {Object.values(suggestedTags).some(arr => arr.length > 0) && (
            <Button
              size="sm"
              onClick={applyAllSuggestions}
              className="gap-1 h-8 text-xs"
            >
              Применить все
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-2">
        <div className="space-y-3">
          {categories.map((category) => {
            const suggested = getSuggestedForCategory(category.id);
            
            return (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader className="py-2.5 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      {category.icon}
                      <span>{category.name}</span>
                      {category.selected.length > 0 && (
                        <Badge variant="secondary" className="text-xs h-5 ml-1">
                          {category.selected.length}
                        </Badge>
                      )}
                    </CardTitle>
                    {category.selected.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => category.setSelected([])}
                        className="h-6 px-2 text-xs"
                      >
                        Очистить
                      </Button>
                    )}
                  </div>
                  {suggested.length > 0 && (
                    <CardDescription className="text-xs pt-1">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        AI: {suggested.slice(0, 3).join(', ')}
                        {suggested.length > 3 && ` +${suggested.length - 3}`}
                      </span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    {category.tags.map((tag) => {
                      const isSelected = category.selected.includes(tag);
                      const isSuggested = suggested.includes(tag);
                      
                      return (
                        <Badge
                          key={tag}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all text-xs h-7 ${
                            isSuggested && !isSelected ? 'border-primary/50 bg-primary/10 animate-pulse' : ''
                          }`}
                          onClick={() => toggleTag(category, tag)}
                        >
                          {tag}
                          {isSuggested && !isSelected && (
                            <Sparkles className="h-2.5 w-2.5 ml-1" />
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Summary Section */}
      {(enrichment.vocalTags.length > 0 || enrichment.instrumentTags.length > 0 || 
        enrichment.dynamicTags.length > 0 || enrichment.emotionalCues.length > 0) && (
        <div className="p-3 bg-muted/50 rounded-lg border border-border/30">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium">Выбрано тегов</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setVocalTags([]);
                setInstrumentTags([]);
                setDynamicTags([]);
                setEmotionalCues([]);
              }}
              className="h-6 px-2 text-xs"
            >
              Очистить всё
            </Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            {enrichment.vocalTags.length > 0 && (
              <div><strong>Вокал:</strong> {enrichment.vocalTags.length}</div>
            )}
            {enrichment.instrumentTags.length > 0 && (
              <div><strong>Инструменты:</strong> {enrichment.instrumentTags.length}</div>
            )}
            {enrichment.dynamicTags.length > 0 && (
              <div><strong>Динамика:</strong> {enrichment.dynamicTags.length}</div>
            )}
            {enrichment.emotionalCues.length > 0 && (
              <div><strong>Эмоции:</strong> {enrichment.emotionalCues.length}</div>
            )}
          </div>
        </div>
      )}
      
      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">💡 Подсказка:</strong> Выбранные теги будут добавлены в текст песни 
          для улучшения генерации. Нажмите на тег для выбора/снятия.
        </p>
      </div>
    </div>
  );
}
