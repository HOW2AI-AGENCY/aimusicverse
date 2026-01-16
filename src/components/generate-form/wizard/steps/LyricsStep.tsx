/**
 * LyricsStep - Fourth step: lyrics input with AI assistance
 */

import { useState, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { FileText, Sparkles, Loader2, ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useGenerationWizardStore } from '@/stores/generationWizardStore';

const LANGUAGE_OPTIONS = [
  { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'mix', label: 'Микс', flag: '🌍' },
];

interface LyricsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function LyricsStep({ onNext, onBack }: LyricsStepProps) {
  const { data, updateData, isAiProcessing, setAiProcessing } = useGenerationWizardStore();
  const [lyrics, setLyrics] = useState(data.lyrics);
  const [language, setLanguage] = useState(data.lyricsLanguage || 'ru');

  const handleLyricsChange = useCallback((value: string) => {
    setLyrics(value);
    updateData({ lyrics: value });
  }, [updateData]);

  const handleLanguageSelect = useCallback((lang: string) => {
    setLanguage(lang);
    updateData({ lyricsLanguage: lang });
  }, [updateData]);

  const handleAiGenerate = useCallback(async () => {
    setAiProcessing(true);
    
    // TODO: Call AI to generate lyrics based on idea, genre, mood
    // For now, simulate with timeout
    await new Promise(r => setTimeout(r, 1500));
    
    const generatedLyrics = `[Verse 1]
Солнце встаёт над городом снова
Новый день, новая дорога
Я иду навстречу мечтам
И ветер поёт мне о чудесах

[Chorus]
Это моя история
Это мой путь
Я не боюсь начать всё сначала
И в небо взлететь`;

    setLyrics(generatedLyrics);
    updateData({ lyrics: generatedLyrics });
    setAiProcessing(false);
  }, [setAiProcessing, updateData]);

  const skipLyrics = !data.hasVocals;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Текст песни</h3>
          <p className="text-sm text-muted-foreground">
            {skipLyrics 
              ? 'Для инструментала текст не нужен'
              : 'Напишите или сгенерируйте с AI'
            }
          </p>
        </div>
      </div>

      {skipLyrics ? (
        <div className="text-center py-8 text-muted-foreground">
          <MicOffIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Вы выбрали инструментал</p>
          <p className="text-sm">Текст песни не требуется</p>
        </div>
      ) : (
        <>
          {/* Language selection */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Язык:</p>
            <div className="flex gap-2">
              {LANGUAGE_OPTIONS.map((option) => (
                <Badge
                  key={option.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5",
                    language === option.id 
                      ? "bg-primary/10 border-primary" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleLanguageSelect(option.id)}
                >
                  <span className="mr-1">{option.flag}</span>
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Lyrics input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Введите текст песни или нажмите 'AI напишет'..."
              value={lyrics}
              onChange={(e) => handleLyricsChange(e.target.value)}
              className="min-h-[150px] resize-none font-mono text-sm"
              maxLength={3000}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{lyrics.length}/3000</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={handleAiGenerate}
                disabled={isAiProcessing}
              >
                {isAiProcessing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                AI напишет
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
        <Button className="flex-1 gap-2" onClick={onNext}>
          {skipLyrics ? (
            <>
              Пропустить
              <SkipForward className="w-4 h-4" />
            </>
          ) : (
            <>
              Далее
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// Simple icon component for instrumental indication
function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
