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
      <div className="flex items-center justify-between">
        <div>
          <Label>Обогащение мета-тегами</Label>
          <p className="text-xs text-muted-foreground">
            Добавьте теги для улучшения генерации
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateSuggestions}
            disabled={isGenerating || writing.sections.every(s => !s.content)}
            className="gap-1"
          >
            <Sparkles className="h-3 w-3" />
            {isGenerating ? 'Анализ...' : 'Подобрать теги'}
          </Button>
          {Object.values(suggestedTags).some(arr => arr.length > 0) && (
            <Button
              size="sm"
              onClick={applyAllSuggestions}
              className="gap-1"
            >
              Применить все
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[350px] pr-4">
        <div className="space-y-4">
          {categories.map((category) => {
            const suggested = getSuggestedForCategory(category.id);
            
            return (
              <Card key={category.id}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {category.icon}
                    {category.name}
                    {category.selected.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {category.selected.length}
                      </Badge>
                    )}
                  </CardTitle>
                  {suggested.length > 0 && (
                    <CardDescription className="text-xs">
                      AI рекомендует: {suggested.join(', ')}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {category.tags.map((tag) => {
                      const isSelected = category.selected.includes(tag);
                      const isSuggested = suggested.includes(tag);
                      
                      return (
                        <Badge
                          key={tag}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all ${
                            isSuggested && !isSelected ? 'border-primary/50 bg-primary/10' : ''
                          }`}
                          onClick={() => toggleTag(category, tag)}
                        >
                          {tag}
                          {isSuggested && !isSelected && (
                            <Sparkles className="h-2 w-2 ml-1" />
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

      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>Подсказка:</strong> Выбранные теги будут добавлены в текст песни 
          для улучшения генерации музыки. Вокальные теги определяют тип голоса, 
          инструменты задают аранжировку, а динамика и эмоции влияют на подачу.
        </p>
      </div>
    </div>
  );
}
