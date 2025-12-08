import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { useLyricsWizardStore } from '@/stores/lyricsWizardStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const GENRES = [
  { value: 'pop', label: 'Поп' },
  { value: 'rock', label: 'Рок' },
  { value: 'hip-hop', label: 'Хип-хоп' },
  { value: 'r&b', label: 'R&B' },
  { value: 'electronic', label: 'Электроника' },
  { value: 'indie', label: 'Инди' },
  { value: 'folk', label: 'Фолк' },
  { value: 'jazz', label: 'Джаз' },
  { value: 'classical', label: 'Классика' },
  { value: 'metal', label: 'Метал' },
  { value: 'country', label: 'Кантри' },
  { value: 'reggae', label: 'Регги' },
];

const MOODS = [
  { value: 'happy', label: 'Радостное' },
  { value: 'sad', label: 'Грустное' },
  { value: 'romantic', label: 'Романтичное' },
  { value: 'energetic', label: 'Энергичное' },
  { value: 'melancholic', label: 'Меланхоличное' },
  { value: 'aggressive', label: 'Агрессивное' },
  { value: 'peaceful', label: 'Умиротворённое' },
  { value: 'nostalgic', label: 'Ностальгическое' },
  { value: 'hopeful', label: 'Обнадёживающее' },
  { value: 'dark', label: 'Мрачное' },
  { value: 'playful', label: 'Игривое' },
  { value: 'epic', label: 'Эпичное' },
];

const THEME_SUGGESTIONS = [
  'Любовь с первого взгляда',
  'Расставание и принятие',
  'Погоня за мечтой',
  'Ночной город',
  'Воспоминания о лете',
  'Внутренняя борьба',
  'Новое начало',
  'Танцы до утра',
];

export function ConceptStep() {
  const { concept, setTheme, setGenre, setMood, setLanguage } = useLyricsWizardStore();
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  const toggleMood = (moodValue: string) => {
    if (concept.mood.includes(moodValue)) {
      setMood(concept.mood.filter(m => m !== moodValue));
    } else if (concept.mood.length < 3) {
      setMood([...concept.mood, moodValue]);
    } else {
      toast.info('Максимум 3 настроения');
    }
  };

  const generateThemeIdea = async () => {
    setIsGeneratingTheme(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'generate',
          genre: concept.genre || 'pop',
          mood: concept.mood[0] || 'romantic',
          language: concept.language,
          theme: 'предложи одну интересную тему для песни в 1-2 предложениях',
        },
      });

      if (error) throw error;
      if (data?.lyrics) {
        setTheme(data.lyrics.trim());
      }
    } catch (err) {
      logger.error('Error generating theme', { error: err });
      toast.error('Не удалось сгенерировать тему');
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="theme">Тема песни *</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateThemeIdea}
            disabled={isGeneratingTheme}
            className="gap-1 text-xs"
          >
            <Sparkles className="h-3 w-3" />
            {isGeneratingTheme ? 'Генерация...' : 'Подсказать идею'}
          </Button>
        </div>
        <Textarea
          id="theme"
          placeholder="О чём будет песня? Опишите историю, эмоции, образы..."
          value={concept.theme}
          onChange={(e) => setTheme(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {THEME_SUGGESTIONS.map((suggestion) => (
            <Badge
              key={suggestion}
              variant="outline"
              className="cursor-pointer hover:bg-accent transition-colors text-xs"
              onClick={() => setTheme(suggestion)}
            >
              {suggestion}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Жанр</Label>
          <Select value={concept.genre} onValueChange={setGenre}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите жанр" />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((genre) => (
                <SelectItem key={genre.value} value={genre.value}>
                  {genre.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Язык</Label>
          <Select value={concept.language} onValueChange={(v) => setLanguage(v as 'ru' | 'en')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ru">Русский</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Настроение (до 3)</Label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((mood) => (
            <Badge
              key={mood.value}
              variant={concept.mood.includes(mood.value) ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => toggleMood(mood.value)}
            >
              {mood.label}
              {concept.mood.includes(mood.value) && (
                <X className="h-3 w-3 ml-1" />
              )}
            </Badge>
          ))}
        </div>
      </div>

      {!concept.theme && (
        <p className="text-sm text-muted-foreground">
          * Тема песни обязательна для продолжения
        </p>
      )}
    </div>
  );
}
