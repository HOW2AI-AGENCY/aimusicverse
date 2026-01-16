/**
 * StyleStep - Second step: choose genre and mood
 */

import { useState, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Music, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGenerationWizardStore } from '@/stores/generationWizardStore';

const GENRES = [
  { id: 'pop', label: 'Pop', emoji: '🎤', color: 'from-pink-500/20 to-purple-500/20' },
  { id: 'rock', label: 'Rock', emoji: '🎸', color: 'from-red-500/20 to-orange-500/20' },
  { id: 'electronic', label: 'Electronic', emoji: '🎹', color: 'from-cyan-500/20 to-blue-500/20' },
  { id: 'hiphop', label: 'Hip-Hop', emoji: '🎧', color: 'from-amber-500/20 to-yellow-500/20' },
  { id: 'rnb', label: 'R&B', emoji: '💜', color: 'from-violet-500/20 to-purple-500/20' },
  { id: 'jazz', label: 'Jazz', emoji: '🎷', color: 'from-yellow-500/20 to-orange-500/20' },
  { id: 'classical', label: 'Classical', emoji: '🎻', color: 'from-slate-500/20 to-gray-500/20' },
  { id: 'ambient', label: 'Ambient', emoji: '🌙', color: 'from-indigo-500/20 to-blue-500/20' },
];

const MOODS = [
  { id: 'energetic', label: 'Энергичный', emoji: '⚡' },
  { id: 'chill', label: 'Спокойный', emoji: '😌' },
  { id: 'happy', label: 'Весёлый', emoji: '😊' },
  { id: 'sad', label: 'Грустный', emoji: '😢' },
  { id: 'romantic', label: 'Романтичный', emoji: '💕' },
  { id: 'dark', label: 'Тёмный', emoji: '🌑' },
  { id: 'epic', label: 'Эпичный', emoji: '🏔️' },
  { id: 'dreamy', label: 'Мечтательный', emoji: '✨' },
];

interface StyleStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function StyleStep({ onNext, onBack }: StyleStepProps) {
  const { data, updateData } = useGenerationWizardStore();
  const [selectedGenre, setSelectedGenre] = useState(data.selectedGenre);
  const [selectedMood, setSelectedMood] = useState(data.selectedMood);

  const handleGenreSelect = useCallback((genreId: string) => {
    setSelectedGenre(genreId);
    updateData({ selectedGenre: genreId });
  }, [updateData]);

  const handleMoodSelect = useCallback((moodId: string) => {
    setSelectedMood(moodId);
    updateData({ selectedMood: moodId });
  }, [updateData]);

  const canProceed = selectedGenre && selectedMood;

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
          <Music className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Выберите стиль</h3>
          <p className="text-sm text-muted-foreground">
            Жанр и настроение вашего трека
          </p>
        </div>
      </div>

      {/* Genre grid */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Жанр:</p>
        <div className="grid grid-cols-4 gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => handleGenreSelect(genre.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                "bg-gradient-to-br border",
                genre.color,
                selectedGenre === genre.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-border"
              )}
            >
              <span className="text-xl">{genre.emoji}</span>
              <span className="text-[10px] font-medium">{genre.label}</span>
              {selectedGenre === genre.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                >
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </motion.div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mood grid */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Настроение:</p>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => handleMoodSelect(mood.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                "bg-muted/50 border",
                selectedMood === mood.id
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-muted"
              )}
            >
              <span className="text-lg">{mood.emoji}</span>
              <span className="text-[10px] font-medium">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
        <Button className="flex-1 gap-2" onClick={onNext} disabled={!canProceed}>
          Далее
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
