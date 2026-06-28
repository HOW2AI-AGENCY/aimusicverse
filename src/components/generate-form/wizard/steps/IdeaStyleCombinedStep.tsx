import { useState, useCallback } from "react";
import { motion } from "@/lib/motion";
import { Lightbulb, Music, ArrowRight, Check, Globe, Lock } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGenerationWizardStore } from "@/stores/generationWizardStore";
import { getAvailableModels } from "@/constants/sunoModels";

const QUICK_IDEAS = [
  { emoji: "🎸", label: "Рок-баллада", prompt: "Эмоциональная рок-баллада о потерянной любви" },
  { emoji: "🎹", label: "Электронный бит", prompt: "Энергичный электронный трек для вечеринки" },
  { emoji: "🎤", label: "Поп-хит", prompt: "Запоминающийся поп-трек с ярким припевом" },
  { emoji: "🔥", label: "Рэп/Хип-хоп", prompt: "Мощный рэп-трек с глубоким битом" },
];

const GENRES = [
  { id: "pop", label: "Pop", emoji: "🎤" },
  { id: "rock", label: "Rock", emoji: "🎸" },
  { id: "electronic", label: "Electronic", emoji: "🎹" },
  { id: "hiphop", label: "Hip-Hop", emoji: "🎧" },
  { id: "rnb", label: "R&B", emoji: "💜" },
  { id: "jazz", label: "Jazz", emoji: "🎷" },
  { id: "classical", label: "Classical", emoji: "🎻" },
  { id: "ambient", label: "Ambient", emoji: "🌙" },
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

interface IdeaStyleCombinedStepProps {
  onNext: () => void;
}

export function IdeaStyleCombinedStep({ onNext }: IdeaStyleCombinedStepProps) {
  const { data, updateData } = useGenerationWizardStore();
  const [localIdea, setLocalIdea] = useState(data.ideaDescription);
  const [selectedGenre, setSelectedGenre] = useState(data.selectedGenre);
  const [selectedMood, setSelectedMood] = useState(data.selectedMood);
  const [title, setTitle] = useState(data.title);
  const [isPublic, setIsPublic] = useState(data.isPublic);
  const [model, setModel] = useState(data.model || "V4_5ALL");

  const availableModels = getAvailableModels();

  const handleQuickIdea = useCallback(
    (prompt: string) => {
      setLocalIdea(prompt);
      updateData({ ideaDescription: prompt });
    },
    [updateData],
  );

  const handleIdeaChange = useCallback(
    (value: string) => {
      setLocalIdea(value);
      updateData({ ideaDescription: value });
    },
    [updateData],
  );

  const canProceed = localIdea.trim().length >= 5 && selectedGenre && selectedMood;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Идея и стиль</h3>
          <p className="text-sm text-muted-foreground">Опишите музыку и выберите жанр</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_IDEAS.map((idea) => (
          <Badge
            key={idea.label}
            variant="outline"
            className={cn(
              "cursor-pointer transition-all hover:bg-primary/10 hover:border-primary",
              localIdea === idea.prompt && "bg-primary/10 border-primary",
            )}
            onClick={() => handleQuickIdea(idea.prompt)}
          >
            <span className="mr-1">{idea.emoji}</span>
            {idea.label}
          </Badge>
        ))}
      </div>

      <Textarea
        placeholder="Опишите музыку, которую хотите создать..."
        value={localIdea}
        onChange={(e) => handleIdeaChange(e.target.value)}
        className="min-h-[80px] resize-none"
        maxLength={500}
      />

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          <Music className="w-3 h-3" /> Жанр:
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => {
                setSelectedGenre(genre.id);
                updateData({ selectedGenre: genre.id });
              }}
              className={cn(
                "relative flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all min-h-[44px] border",
                selectedGenre === genre.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted/50",
              )}
            >
              <span className="text-lg">{genre.emoji}</span>
              <span className="text-[10px] font-medium">{genre.label}</span>
              {selectedGenre === genre.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center"
                >
                  <Check className="w-2 h-2 text-primary-foreground" />
                </motion.div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Настроение:</p>
        <div className="grid grid-cols-4 gap-1.5">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => {
                setSelectedMood(mood.id);
                updateData({ selectedMood: mood.id });
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all min-h-[44px] border",
                selectedMood === mood.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted/50",
              )}
            >
              <span className="text-lg">{mood.emoji}</span>
              <span className="text-[10px] font-medium">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border/50">
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

      <Button className="w-full gap-2 h-11" onClick={onNext} disabled={!canProceed}>
        Далее
        <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}
