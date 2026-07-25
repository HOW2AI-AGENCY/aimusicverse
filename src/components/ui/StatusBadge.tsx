/**
 * StatusBadge - Semantic status indicators
 * Phase 5 Professional UI (Spec 032)
 *
 * Features:
 * - Multiple status variants
 * - Animated pulsing for active states
 * - Icon support
 * - Consistent styling
 */

import { memo, ReactNode } from "react";
import { motion } from "@/lib/motion";
import {
  Check,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  Sparkles,
  Music2,
  Mic,
  Volume2,
  Download,
  type LucideIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

type StatusType =
  | "success"
  | "pending"
  | "warning"
  | "error"
  | "loading"
  | "generating"
  | "playing"
  | "processing"
  | "downloading"
  | "idle"
  | "custom";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  icon?: LucideIcon | ReactNode;
  pulse?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const statusConfig: Record<
  Exclude<StatusType, "custom">,
  {
    icon: LucideIcon;
    label: string;
    bgClass: string;
    textClass: string;
    pulse?: boolean;
  }
> = {
  success: {
    icon: Check,
    label: "Готово",
    bgClass: "bg-green-500/15",
    textClass: "text-green-600 dark:text-green-400",
  },
  pending: {
    icon: Clock,
    label: "Ожидание",
    bgClass: "bg-yellow-500/15",
    textClass: "text-yellow-600 dark:text-yellow-400",
    pulse: true,
  },
  warning: {
    icon: AlertCircle,
    label: "Внимание",
    bgClass: "bg-amber-500/15",
    textClass: "text-amber-600 dark:text-amber-400",
  },
  error: {
    icon: XCircle,
    label: "Ошибка",
    bgClass: "bg-red-500/15",
    textClass: "text-red-600 dark:text-red-400",
  },
  loading: {
    icon: Loader2,
    label: "Загрузка",
    bgClass: "bg-blue-500/15",
    textClass: "text-blue-600 dark:text-blue-400",
    pulse: true,
  },
  generating: {
    icon: Sparkles,
    label: "Генерация",
    bgClass: "bg-primary/15",
    textClass: "text-primary",
    pulse: true,
  },
  playing: {
    icon: Volume2,
    label: "Играет",
    bgClass: "bg-green-500/15",
    textClass: "text-green-600 dark:text-green-400",
    pulse: true,
  },
  processing: {
    icon: Loader2,
    label: "Обработка",
    bgClass: "bg-violet-500/15",
    textClass: "text-violet-600 dark:text-violet-400",
    pulse: true,
  },
  downloading: {
    icon: Download,
    label: "Загрузка",
    bgClass: "bg-cyan-500/15",
    textClass: "text-cyan-600 dark:text-cyan-400",
    pulse: true,
  },
  idle: {
    icon: Music2,
    label: "Готов",
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
  },
};

export const StatusBadge = memo(function StatusBadge({
  status,
  label,
  icon,
  pulse,
  size = "sm",
  className,
}: StatusBadgeProps) {
  const config = status !== "custom" ? statusConfig[status] : null;

  const displayLabel = label ?? config?.label ?? "";
  const shouldPulse = pulse ?? config?.pulse ?? false;
  const bgClass = config?.bgClass ?? "bg-muted";
  const textClass = config?.textClass ?? "text-muted-foreground";

  const IconComponent = (icon as LucideIcon) ?? config?.icon ?? Check;
  const isCustomIcon = typeof icon !== "function" && icon !== undefined;
  const isSpinning = status === "loading" || status === "processing";

  const sizeClasses = {
    xs: {
      badge: "px-1.5 py-0.5 gap-1 text-[0.625rem]",
      icon: "w-2.5 h-2.5",
    },
    sm: {
      badge: "px-2 py-1 gap-1.5 text-xs",
      icon: "w-3 h-3",
    },
    md: {
      badge: "px-2.5 py-1.5 gap-2 text-sm",
      icon: "w-4 h-4",
    },
  };

  const s = sizeClasses[size];

  return (
    <motion.span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        "border border-transparent",
        bgClass,
        textClass,
        s.badge,
        className,
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Pulse indicator */}
      {shouldPulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              textClass.replace("text-", "bg-").split(" ")[0],
            )}
          />
          <span
            className={cn("relative inline-flex rounded-full h-2 w-2", textClass.replace("text-", "bg-").split(" ")[0])}
          />
        </span>
      )}

      {/* Icon */}
      {!shouldPulse &&
        (isCustomIcon ? (
          <span className={s.icon}>{icon}</span>
        ) : (
          <IconComponent className={cn(s.icon, isSpinning && "animate-spin")} />
        ))}

      {/* Label */}
      {displayLabel && <span>{displayLabel}</span>}
    </motion.span>
  );
});

// Quick status dot for minimal UI
interface StatusDotProps {
  status: "online" | "offline" | "busy" | "away";
  size?: "xs" | "sm" | "md";
  pulse?: boolean;
  className?: string;
}

const dotColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  busy: "bg-red-500",
  away: "bg-yellow-500",
};

export const StatusDot = memo(function StatusDot({ status, size = "sm", pulse = false, className }: StatusDotProps) {
  const sizes = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-3 h-3",
  };

  return (
    <span className={cn("relative inline-flex", className)}>
      {pulse && status === "online" && (
        <span
          className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotColors[status])}
        />
      )}
      <span className={cn("relative inline-flex rounded-full", sizes[size], dotColors[status])} />
    </span>
  );
});
