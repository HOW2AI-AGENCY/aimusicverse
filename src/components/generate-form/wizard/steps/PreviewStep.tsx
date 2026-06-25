/**
 * PreviewStep - Final step: review and generate
 */

import { motion } from "@/lib/motion";
import { Sparkles, ArrowLeft, Music, Mic, FileText, Settings, Check } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGenerationWizardStore } from "@/stores/generationWizardStore";
import { SUNO_MODELS } from "@/constants/sunoModels";

interface PreviewStepProps {
  onGenerate: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function PreviewStep({ onGenerate, onBack, isLoading }: PreviewStepProps) {
  const { data } = useGenerationWizardStore();
  const currentModel = SUNO_MODELS[data.model] || SUNO_MODELS.V4_5ALL;

  const summaryItems = [
    {
      icon: Music,
      label: "Стиль",
      value: `${data.selectedGenre || "Не выбран"} / ${data.selectedMood || "Не выбран"}`,
    },
    {
      icon: Mic,
      label: "Вокал",
      value: data.hasVocals
        ? `${data.vocalGender === "m" ? "Мужской" : data.vocalGender === "f" ? "Женский" : "Любой"}${data.vocalStyle ? `, ${data.vocalStyle}` : ""}`
        : "Инструментал",
    },
    {
      icon: FileText,
      label: "Текст",
      value: data.hasVocals ? (data.lyrics ? `${data.lyrics.slice(0, 50)}...` : "AI сгенерирует") : "Не требуется",
    },
    {
      icon: Settings,
      label: "Модель",
      value: `${currentModel.emoji} ${currentModel.name} (${currentModel.cost}💎)`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">Готово к генерации!</h3>
          <p className="text-sm text-muted-foreground">Проверьте настройки и запустите</p>
        </div>
      </div>

      {/* Title preview */}
      {data.title && (
        <div className="p-3 rounded-xl bg-muted/50 border">
          <p className="text-xs text-muted-foreground mb-1">Название:</p>
          <p className="font-medium">{data.title}</p>
        </div>
      )}

      {/* Idea preview */}
      <div className="p-3 rounded-xl bg-muted/50 border">
        <p className="text-xs text-muted-foreground mb-1">Идея:</p>
        <p className="text-sm">{data.ideaDescription || "Не указана"}</p>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        {summaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium truncate">{item.value}</p>
              </div>
              <Check className="w-4 h-4 text-green-500" />
            </div>
          );
        })}
      </div>

      {/* Privacy badge */}
      <div className="flex items-center justify-center">
        <Badge variant={data.isPublic ? "default" : "secondary"}>
          {data.isPublic ? "🌍 Публичный трек" : "🔒 Приватный трек"}
        </Badge>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
        <Button
          className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80"
          onClick={onGenerate}
          disabled={isLoading}
        >
          <Sparkles className="w-4 h-4" />
          Сгенерировать!
        </Button>
      </div>
    </motion.div>
  );
}
