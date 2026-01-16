/**
 * IdeaStep - First step: describe your music idea with AI assistance
 */

import { useState, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Lightbulb, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useGenerationWizardStore } from '@/stores/generationWizardStore';

const QUICK_IDEAS = [
  { emoji: '🎸', label: 'Рок-баллада', prompt: 'Эмоциональная рок-баллада о потерянной любви' },
  { emoji: '🎹', label: 'Электронный бит', prompt: 'Энергичный электронный трек для вечеринки' },
  { emoji: '🎤', label: 'Поп-хит', prompt: 'Запоминающийся поп-трек с ярким припевом' },
  { emoji: '🎻', label: 'Кинематограф', prompt: 'Эпическая оркестровая музыка для фильма' },
  { emoji: '🎷', label: 'Джаз', prompt: 'Расслабляющий джазовый трек для кафе' },
  { emoji: '🔥', label: 'Рэп/Хип-хоп', prompt: 'Мощный рэп-трек с глубоким битом' },
];

interface IdeaStepProps {
  onNext: () => void;
}

export function IdeaStep({ onNext }: IdeaStepProps) {
  const { data, updateData, isAiProcessing, setAiProcessing } = useGenerationWizardStore();
  const [localIdea, setLocalIdea] = useState(data.ideaDescription);

  const handleQuickIdea = useCallback((prompt: string) => {
    setLocalIdea(prompt);
    updateData({ ideaDescription: prompt });
  }, [updateData]);

  const handleIdeaChange = useCallback((value: string) => {
    setLocalIdea(value);
    updateData({ ideaDescription: value });
  }, [updateData]);

  const handleAiSuggest = useCallback(async () => {
    if (!localIdea.trim()) return;
    
    setAiProcessing(true);
    // TODO: Call AI to get genre suggestions based on idea
    // For now, simulate with timeout
    await new Promise(r => setTimeout(r, 1000));
    
    updateData({
      suggestedGenres: ['Pop', 'Rock', 'Electronic'],
    });
    setAiProcessing(false);
    onNext();
  }, [localIdea, setAiProcessing, updateData, onNext]);

  const canProceed = localIdea.trim().length >= 5;

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
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Опишите вашу идею</h3>
          <p className="text-sm text-muted-foreground">
            Что вы хотите создать? AI поможет уточнить детали
          </p>
        </div>
      </div>

      {/* Quick ideas */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Быстрый старт:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_IDEAS.map((idea) => (
            <Badge
              key={idea.label}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all hover:bg-primary/10 hover:border-primary",
                localIdea === idea.prompt && "bg-primary/10 border-primary"
              )}
              onClick={() => handleQuickIdea(idea.prompt)}
            >
              <span className="mr-1">{idea.emoji}</span>
              {idea.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Idea input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Опишите музыку, которую хотите создать... Например: 'Летний поп-трек с позитивным настроением о путешествиях'"
          value={localIdea}
          onChange={(e) => handleIdeaChange(e.target.value)}
          className="min-h-[100px] resize-none"
          maxLength={500}
        />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{localIdea.length}/500</span>
          {localIdea.length < 5 && (
            <span className="text-destructive">Минимум 5 символов</span>
          )}
        </div>
      </div>

      {/* AI Suggestion button */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={handleAiSuggest}
          disabled={!canProceed || isAiProcessing}
        >
          {isAiProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          AI подскажет стиль
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={onNext}
          disabled={!canProceed}
        >
          Далее
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
