import { memo } from "react";
import { Grid3X3 } from "@/lib/icons";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MoreMenuHintTooltipProps {
  visible: boolean;
  onDismiss: () => void;
}

export const MoreMenuHintTooltip = memo(function MoreMenuHintTooltip({ visible, onDismiss }: MoreMenuHintTooltipProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "absolute bottom-full left-0 z-50 mb-3 w-64",
            "rounded-2xl bg-popover border border-border/60",
            "shadow-xl shadow-black/10 dark:shadow-black/30",
            "p-4",
          )}
          role="tooltip"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Grid3X3 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Дополнительные функции здесь</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                Нажмите «Ещё» для доступа к студии, сообществу и настройкам
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="mt-2.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
