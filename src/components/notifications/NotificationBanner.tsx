import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/notifications";

interface NotificationBannerProps {
  notification: NotificationItem;
  onDismiss: (id: string) => void;
  onAction?: (id: string) => void;
  className?: string;
}

export const NotificationBanner = memo(function NotificationBanner({
  notification,
  onDismiss,
  onAction,
  className,
}: NotificationBannerProps) {
  const { id, title, message, action, type, priority } = notification;

  const typeStyles = {
    "generation-complete": "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    error: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60",
    success: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60",
    info: "bg-muted/60 border-border/60",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={cn(
        "relative flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg",
        typeStyles[type],
        priority === "high" && "ring-2 ring-primary/20",
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
        {action && (
          <button
            onClick={() => onAction?.(id)}
            className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center hover:bg-foreground/10 transition-colors"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </motion.div>
  );
});
