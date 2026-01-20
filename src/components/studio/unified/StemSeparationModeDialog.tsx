/**
 * StemSeparationModeDialog - Dialog for choosing stem separation mode
 * Simple (2 stems) or Detailed (6+ stems)
 * 
 * Integrates with Telegram SecondaryButton for native cancel action
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Music, Mic2, Drum, Guitar, Piano, Waves, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useTelegramSecondaryButton } from '@/hooks/telegram/useTelegramSecondaryButton';

type SeparationMode = 'simple' | 'detailed';

interface StemSeparationModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mode: SeparationMode) => void;
  isProcessing?: boolean;
}

const MODES = {
  simple: {
    label: 'Простое разделение',
    description: '2 стема',
    cost: 10,  // Credits cost synced with sunoapi.org
    stems: [
      { icon: Mic2, label: 'Вокал', color: 'text-pink-500' },
      { icon: Music, label: 'Инструментал', color: 'text-blue-500' },
    ],
    time: '~1 мин',
    bgGradient: 'from-pink-500/10 to-blue-500/10',
  },
  detailed: {
    label: 'Детальное разделение',
    description: '12+ стемов',
    cost: 50,  // Credits cost synced with sunoapi.org
    stems: [
      { icon: Mic2, label: 'Вокал', color: 'text-pink-500' },
      { icon: Drum, label: 'Ударные', color: 'text-orange-500' },
      { icon: Waves, label: 'Бас', color: 'text-purple-500' },
      { icon: Piano, label: 'Пианино', color: 'text-emerald-500' },
      { icon: Guitar, label: 'Гитара', color: 'text-amber-500' },
      { icon: Music, label: 'Другое', color: 'text-cyan-500' },
    ],
    time: '~2-3 мин',
    bgGradient: 'from-purple-500/10 via-pink-500/5 to-emerald-500/10',
  },
} as const;

export function StemSeparationModeDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
}: StemSeparationModeDialogProps) {
  const [selectedMode, setSelectedMode] = useState<SeparationMode>('simple');
  const { impact, select } = useHapticFeedback();

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Telegram SecondaryButton for cancel action
  const { shouldShowUIButton } = useTelegramSecondaryButton({
    text: 'Отмена',
    onClick: handleCancel,
    enabled: !isProcessing,
    visible: open,
    position: 'left',
  });

  const handleSelect = (mode: SeparationMode) => {
    select();
    setSelectedMode(mode);
  };

  const handleConfirm = () => {
    impact('medium');
    onConfirm(selectedMode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Разделение на стемы</DialogTitle>
          <DialogDescription>
            Выберите режим разделения трека на отдельные дорожки
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {(Object.entries(MODES) as [SeparationMode, typeof MODES.simple][]).map(([mode, config]) => (
            <motion.button
              key={mode}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(mode)}
              disabled={isProcessing}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all text-left",
                "bg-gradient-to-r",
                config.bgGradient,
                selectedMode === mode
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{config.label}</h3>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
                <AnimatePresence mode="wait">
                  {selectedMode === mode && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap gap-2">
                {config.stems.map((stem, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-full",
                      "bg-background/50 border border-border/50"
                    )}
                  >
                    <stem.icon className={cn("w-3.5 h-3.5", stem.color)} />
                    <span className="text-xs">{stem.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  Примерное время: {config.time}
                </p>
                <span className="text-xs font-medium text-primary">
                  {config.cost} 💎
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="flex gap-2">
          {/* Show UI cancel button only when native SecondaryButton is not available */}
          {shouldShowUIButton && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              Отмена
            </Button>
          )}
          <Button
            className={cn("flex-1", !shouldShowUIButton && "w-full")}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              'Начать'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
