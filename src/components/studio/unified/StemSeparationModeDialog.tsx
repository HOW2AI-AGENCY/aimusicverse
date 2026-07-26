/**
 * StemSeparationModeDialog - Dialog for choosing stem separation mode
 * Simple (2 stems) or Detailed (6+ stems)
 *
 * Integrates with Telegram SecondaryButton for native cancel action
 */

import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Music, Mic2, Drum, Guitar, Piano, Waves, Check, Loader2, AlertCircle } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { UnifiedDialog } from "@/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useTelegramSecondaryButton } from "@/hooks/telegram/useTelegramSecondaryButton";

type SeparationMode = "simple" | "detailed";

interface StemSeparationModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mode: SeparationMode) => void;
  isProcessing?: boolean;
  trackDurationSeconds?: number;
  hasExistingStems?: boolean;
}

const MODES = {
  simple: {
    label: "Простое разделение",
    description: "2 стема",
    cost: 10, // Credits cost synced with sunoapi.org
    stems: [
      { icon: Mic2, label: "Вокал", color: "text-pink-500" },
      { icon: Music, label: "Инструментал", color: "text-blue-500" },
    ],
    time: "~1 мин",
    bgGradient: "from-pink-500/10 to-blue-500/10",
  },
  detailed: {
    label: "Детальное разделение",
    description: "12+ стемов",
    cost: 50, // Credits cost synced with sunoapi.org
    stems: [
      { icon: Mic2, label: "Вокал", color: "text-pink-500" },
      { icon: Drum, label: "Ударные", color: "text-orange-500" },
      { icon: Waves, label: "Бас", color: "text-purple-500" },
      { icon: Piano, label: "Пианино", color: "text-emerald-500" },
      { icon: Guitar, label: "Гитара", color: "text-amber-500" },
      { icon: Music, label: "Другое", color: "text-cyan-500" },
    ],
    time: "~2-3 мин",
    bgGradient: "from-purple-500/10 via-pink-500/5 to-emerald-500/10",
  },
} as const;

export function StemSeparationModeDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
  trackDurationSeconds,
  hasExistingStems,
}: StemSeparationModeDialogProps) {
  const [selectedMode, setSelectedMode] = useState<SeparationMode>("simple");
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const { impact, select } = useHapticFeedback();

  const handleCancel = () => {
    if (isProcessing) {
      setConfirmCancelOpen(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleForceClose = () => {
    setConfirmCancelOpen(false);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && isProcessing) {
      setConfirmCancelOpen(true);
    } else {
      onOpenChange(open);
    }
  };

  // Telegram SecondaryButton for cancel action
  const { shouldShowUIButton } = useTelegramSecondaryButton({
    text: "Отмена",
    onClick: handleCancel,
    enabled: !isProcessing,
    visible: open,
    position: "left",
  });

  const handleSelect = (mode: SeparationMode) => {
    select();
    setSelectedMode(mode);
  };

  const handleConfirm = () => {
    impact("medium");
    onConfirm(selectedMode);
  };

  return (
    <>
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={handleOpenChange}
      title="Разделение на стемы"
      description="Выберите режим разделения трека на отдельные дорожки"
      size="sm"
      footer={
        <div className="flex gap-2">
          {/* Show UI cancel button only when native SecondaryButton is not available */}
          {shouldShowUIButton && (
            <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={isProcessing}>
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
              "Начать"
            )}
          </Button>
        </div>
      }
    >
      {/* Existing stems warning */}
      {hasExistingStems && (
        <div className="px-4 pt-2">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-700 dark:text-blue-300">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Стемы для этого трека уже существуют. Повторное разделение создаст дополнительные стемы и спишет кредиты.
            </span>
          </div>
        </div>
      )}
      {/* Duration warning for long tracks */}
      {trackDurationSeconds && trackDurationSeconds > 300 && (
        <div className="px-4 pt-2">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Трек длиннее 5 минут ({Math.round(trackDurationSeconds / 60)} мин). Разделение может занять больше времени.
            </span>
          </div>
        </div>
      )}
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
              selectedMode === mode ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
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
                    "bg-background/50 border border-border/50",
                  )}
                >
                  <stem.icon className={cn("w-3.5 h-3.5", stem.color)} />
                  <span className="text-xs">{stem.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Примерное время: {config.time}</p>
              <span className="text-xs font-medium text-primary">{config.cost} 💎</span>
            </div>
          </motion.button>
        ))}
      </div>
    </UnifiedDialog>

      {/* Confirm cancel when processing */}
      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить разделение?</AlertDialogTitle>
            <AlertDialogDescription>
              Разделение на стемы уже выполняется. Вы уверены, что хотите отменить? Прогресс будет потерян.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Продолжить</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceClose}>Отменить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
