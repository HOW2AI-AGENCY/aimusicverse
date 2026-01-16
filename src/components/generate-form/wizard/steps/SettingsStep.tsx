/**
 * SettingsStep - Fifth step: title and final settings
 */

import { useState, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Settings, ArrowLeft, ArrowRight, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGenerationWizardStore } from '@/stores/generationWizardStore';
import { SUNO_MODELS, getAvailableModels } from '@/constants/sunoModels';

interface SettingsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function SettingsStep({ onNext, onBack }: SettingsStepProps) {
  const { data, updateData } = useGenerationWizardStore();
  const [title, setTitle] = useState(data.title);
  const [isPublic, setIsPublic] = useState(data.isPublic);
  const [model, setModel] = useState(data.model || 'V4_5ALL');

  const availableModels = getAvailableModels();

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    updateData({ title: value });
  }, [updateData]);

  const handlePublicToggle = useCallback((value: boolean) => {
    setIsPublic(value);
    updateData({ isPublic: value });
  }, [updateData]);

  const handleModelSelect = useCallback((modelKey: string) => {
    setModel(modelKey);
    updateData({ model: modelKey });
  }, [updateData]);

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
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Финальные настройки</h3>
          <p className="text-sm text-muted-foreground">
            Название и параметры генерации
          </p>
        </div>
      </div>

      {/* Title input */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">
          Название трека (опционально):
        </label>
        <Input
          placeholder="AI придумает название, если оставить пустым"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          maxLength={80}
        />
      </div>

      {/* Privacy toggle */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">
          Приватность:
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handlePublicToggle(true)}
            className={cn(
              "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
              isPublic
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Публичный</span>
          </button>
          <button
            type="button"
            onClick={() => handlePublicToggle(false)}
            className={cn(
              "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
              !isPublic
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Приватный</span>
          </button>
        </div>
      </div>

      {/* Model selection */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">
          Модель AI:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableModels.slice(0, 4).map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => handleModelSelect(m.key)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                model === m.key
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="text-lg">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate">{m.name}</span>
                  {m.status === 'latest' && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-primary/20 text-primary font-bold">
                      NEW
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">{m.cost}💎</span>
              </div>
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
        <Button className="flex-1 gap-2" onClick={onNext}>
          Далее
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
