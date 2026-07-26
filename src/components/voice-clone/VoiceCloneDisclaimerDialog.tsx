/**
 * VoiceCloneDisclaimerDialog
 *
 * Occasional reminder that a cloned voice reproduces timbre and singing style,
 * not an exact copy of a person's voice. Shown at most once per
 * DISCLAIMER_INTERVAL_MS (7 days), triggered when the user picks a custom voice
 * for a generation.
 */

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Mic2, Sparkles } from "@/lib/icons";

const DISCLAIMER_KEY = "mv:voice-clone-disclaimer-shown-at";
/** Minimum time between two reminders — 7 days. */
export const DISCLAIMER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/** True when the reminder has not been shown within the last 7 days. */
export function shouldShowVoiceDisclaimer(now = Date.now()): boolean {
  try {
    const raw = localStorage.getItem(DISCLAIMER_KEY);
    if (!raw) return true;
    const last = Number(raw);
    if (!Number.isFinite(last)) return true;
    return now - last >= DISCLAIMER_INTERVAL_MS;
  } catch {
    return false;
  }
}

export function markVoiceDisclaimerShown(now = Date.now()) {
  try {
    localStorage.setItem(DISCLAIMER_KEY, String(now));
  } catch {
    /* storage unavailable */
  }
}

interface VoiceCloneDisclaimerDialogProps {
  /** When true, the dialog opens if the 7-day cooldown has passed. */
  trigger: boolean;
  onClose?: () => void;
}

export function VoiceCloneDisclaimerDialog({ trigger, onClose }: VoiceCloneDisclaimerDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (trigger && shouldShowVoiceDisclaimer()) {
      setOpen(true);
      markVoiceDisclaimerShown();
    }
  }, [trigger]);

  const handleChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) onClose?.();
    },
    [onClose],
  );

  return (
    <Dialog open={open} onOpenChange={handleChange}>
      <DialogContent className="max-w-[min(420px,calc(100vw-2rem))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Info className="w-4 h-4 text-primary shrink-0" />
            Как работает клонирование голоса
          </DialogTitle>
          <DialogDescription className="text-left">
            Это не точная копия голоса человека.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <Mic2 className="w-4 h-4 mt-0.5 text-pink-500 shrink-0" />
            <span>
              Модель воспроизводит <strong className="text-foreground">тембр и стилистику</strong> пения — характер
              звучания, а не точный голос.
            </span>
          </li>
          <li className="flex gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 text-primary shrink-0" />
            <span>
              Каждая генерация уникальна: интонации, дыхание и артикуляция будут отличаться от исходной записи.
            </span>
          </li>
          <li className="flex gap-2">
            <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            <span>Используйте только те голоса, на запись которых у вас есть право.</span>
          </li>
        </ul>

        <Button className="w-full mt-2" onClick={() => handleChange(false)}>
          Понятно
        </Button>
      </DialogContent>
    </Dialog>
  );
}
