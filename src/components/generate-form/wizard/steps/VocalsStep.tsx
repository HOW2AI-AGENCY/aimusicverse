/**
 * VocalsStep - Third step: vocal settings
 */

import { useState, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Mic, MicOff, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGenerationWizardStore } from '@/stores/generationWizardStore';

const VOCAL_STYLES = [
  { id: 'clean', label: 'Чистый', description: 'Без эффектов' },
  { id: 'raspy', label: 'Хриплый', description: 'Рок-стиль' },
  { id: 'smooth', label: 'Мягкий', description: 'R&B/Soul' },
  { id: 'powerful', label: 'Мощный', description: 'Высокая подача' },
];

interface VocalsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function VocalsStep({ onNext, onBack }: VocalsStepProps) {
  const { data, updateData } = useGenerationWizardStore();
  const [hasVocals, setHasVocals] = useState(data.hasVocals);
  const [vocalGender, setVocalGender] = useState<'' | 'm' | 'f'>(data.vocalGender);
  const [vocalStyle, setVocalStyle] = useState(data.vocalStyle);

  const handleVocalsToggle = useCallback((value: boolean) => {
    setHasVocals(value);
    updateData({ hasVocals: value });
    if (!value) {
      setVocalGender('');
      setVocalStyle('');
      updateData({ vocalGender: '', vocalStyle: '' });
    }
  }, [updateData]);

  const handleGenderSelect = useCallback((gender: '' | 'm' | 'f') => {
    setVocalGender(gender);
    updateData({ vocalGender: gender });
  }, [updateData]);

  const handleStyleSelect = useCallback((style: string) => {
    setVocalStyle(style);
    updateData({ vocalStyle: style });
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
          <Mic className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Настройки вокала</h3>
          <p className="text-sm text-muted-foreground">
            С вокалом или инструментал?
          </p>
        </div>
      </div>

      {/* Vocals toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleVocalsToggle(true)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
            hasVocals
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          )}
        >
          <Mic className={cn("w-6 h-6", hasVocals && "text-primary")} />
          <span className="text-sm font-medium">С вокалом</span>
        </button>
        <button
          type="button"
          onClick={() => handleVocalsToggle(false)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
            !hasVocals
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          )}
        >
          <MicOff className={cn("w-6 h-6", !hasVocals && "text-primary")} />
          <span className="text-sm font-medium">Инструментал</span>
        </button>
      </div>

      {/* Vocal options (only if vocals enabled) */}
      {hasVocals && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          {/* Gender selection */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Голос:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '', label: 'Любой', icon: '🎭' },
                { id: 'm', label: 'Мужской', icon: '👨' },
                { id: 'f', label: 'Женский', icon: '👩' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleGenderSelect(option.id as '' | 'm' | 'f')}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                    vocalGender === option.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span>{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vocal style */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Стиль вокала:</p>
            <div className="grid grid-cols-2 gap-2">
              {VOCAL_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleStyleSelect(style.id)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 p-3 rounded-xl border transition-all text-left",
                    vocalStyle === style.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-sm font-medium">{style.label}</span>
                  <span className="text-[10px] text-muted-foreground">{style.description}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

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
