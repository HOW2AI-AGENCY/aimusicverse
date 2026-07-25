/**
 * PlayerGestureHints — first-run gesture cheatsheet for the mobile fullscreen player.
 *
 * Shown once per device (gated by localStorage). Dismissed on tap, swipe, or after 6s.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { ChevronDown, ChevronsLeftRight, MousePointerClick, Pointer } from "@/lib/icons";

const STORAGE_KEY = "mv:player-gesture-hints-seen";

const HINTS = [
  { icon: ChevronDown, label: "Свайп вниз — закрыть" },
  { icon: ChevronsLeftRight, label: "Свайп вбок — соседний трек" },
  { icon: MousePointerClick, label: "Двойной тап — ±10 секунд" },
  { icon: Pointer, label: "Долгий пресс — действия" },
];

export function PlayerGestureHints() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (window.localStorage.getItem(STORAGE_KEY)) return;
      // Defer to avoid competing with player mount animations
      const t = window.setTimeout(() => setVisible(true), 450);
      return () => window.clearTimeout(t);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => dismiss(), 6000);
    return () => window.clearTimeout(t);
     
  }, [visible]);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="gesture-hints"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-30 flex items-center justify-center px-6 pointer-events-auto"
          onClick={dismiss}
          onTouchStart={dismiss}
          role="dialog"
          aria-label="Подсказки по жестам"
        >
          {/* dim backdrop */}
          <div className="absolute inset-0 bg-background/55 backdrop-blur-sm" />

          <motion.div
            initial={{ y: 12, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 8, scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-[18rem] rounded-2xl aurora-surface aurora-glow p-4 space-y-2.5"
          >
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80 text-center">
              Подсказки
            </p>
            <ul className="space-y-2">
              {HINTS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-[0.8125rem] text-foreground">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="leading-tight">{label}</span>
                </li>
              ))}
            </ul>
            <p className="text-[0.6875rem] text-muted-foreground/70 text-center pt-1">Тап в любом месте — закрыть</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
