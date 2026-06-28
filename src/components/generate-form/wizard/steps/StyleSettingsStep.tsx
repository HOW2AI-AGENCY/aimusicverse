/**
 * StyleSettingsStep - Combined style (genre/mood) + settings (title/privacy/model)
 */

import { useState, useCallback } from "react";
import { motion } from "@/lib/motion";
import { Music, Check, ArrowLeft, ArrowRight, Globe, Lock } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useGenerationWizardStore } from "@/stores/generationWizardStore";
import { getAvailableModels } from "@/constants/sunoModels";

const GENRES = [
  { id: "pop", label: "Pop", emoji: "🎤", color: "from-pink-500/20 to-purple-500/20" },
  { id: "rock", label: "Rock", emoji: "🎸", color: "from-red-500/20 to-orange-500/20" },
  { id: "electronic", label: "Electronic", emoji: "🎹", color: "from-cyan-500/20 to-blue-500/20" },
  { id: "hiphop", label: "Hip-Hop", emoji: "🎧", color: "from-amber-500/20 to-yellow-500/20" },
  { id: "rnb", label: "R&B", emoji: "💜", color: "from-violet-500/20 to-purple-500/20" },
  { id: "jazz", label: "Jazz", emoji: "🎷", color: "from-yellow-500/20 to-orange-500/20" },
  { id: "classical", label: "Classical", emoji: "🎻", color: "from-slate-500/20 to-gray-500/20" },
  { id: "ambient", label: "Ambient", emoji: "🌙", color: "from-indigo-500/20 to-blue-500/20" },
];

const MOODS = [
  { id: "energetic", label: "Энергичный", emoji: "⚡" },
  { id: "chill", label: "Спокойный", emoji: "😌" },
  { id: "happy", label: "Весёлый", emoji: "😊" },
  { id: "sad", label: "Грустный", emoji: "😢" },
  { id: "romantic", label: "Романтичный", emoji: "💕" },
  { id: "dark", label: "Тёмный", emoji: "🌑" },
  { id: "epic", label: "Эпичный", emoji: "🏔️" },
  { id: "dreamy", label: "Мечтательный", emoji: "✨" },
];

interface StyleSettingsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function StyleSettingsStep({ onNext, onBack }: StyleSettingsStepProps) {
  const { data, updateData } = useGenerationWizardStore();
  const [selectedGenre, setSelectedGenre] = useState(data.selectedGenre);
  const [selectedMood, setSelectedMood] = useState(data.selectedMood);
  const [title, setTitle] = useState(data.title);
  const [isPublic, setIsPublic] = useState(data.isPublic);
  const [model, setModel] = useState(data.model || "V4_5ALL");

  const availableModels = getAvailableModels();

  const handleGenreSelect = useCallback(
    (genreId: string) => {
      setSelectedGenre(genreId);
      updateData({ selectedGenre: genreId });
    },
    [updateData],
  );

  const handleMoodSelect = useCallback(
    (moodId: string) => {
      setSelectedMood(moodId);
      updateData({ selectedMood: moodId });
    },
    [updateData],
  );

  const canProceed = selectedGenre && selectedMood;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Music className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Стиль и настройки</h3>
          <p className="text-sm text-muted-foreground">Жанр, настроение и параметры трека</p>
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
                "relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-h-[44px]",
                "bg-gradient-to-br border",
                genre.color,
                selectedGenre === genre.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-border",
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
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-h-[44px]",
                "bg-muted/50 border",
                selectedMood === mood.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted",
              )}
            >
              <span className="text-lg">{mood.emoji}</span>
              <span className="text-[10px] font-medium">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compact settings row */}
      <div className="space-y-3 pt-2 border-t border-border/50">
        <Input
          placeholder="Название трека (AI придумает, если пусто)"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            updateData({ title: e.target.value });
          }}
          maxLength={80}
          className="h-11"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setIsPublic(!isPublic);
              updateData({ isPublic: !isPublic });
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm min-h-[44px]",
              isPublic ? "border-primary/50 bg-primary/10" : "border-border",
            )}
          >
            {isPublic ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4" />}
            {isPublic ? "Публичный" : "Приватный"}
          </button>

          <div className="flex-1 flex gap-1.5 overflow-x-auto">
            {availableModels.slice(0, 3).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setModel(m.key);
                  updateData({ model: m.key });
                }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-2 rounded-xl border transition-all text-xs whitespace-nowrap min-h-[44px]",
                  model === m.key ? "border-primary bg-primary/10" : "border-border",
                )}
              >
                <span>{m.emoji}</span>
                <span className="font-medium">{m.name}</span>
                <span className="text-muted-foreground">{m.cost}💎</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-2 h-11" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
        <Button className="flex-1 gap-2 h-11" onClick={onNext} disabled={!canProceed}>
          Далее
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
