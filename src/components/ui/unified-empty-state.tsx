/**
 * UnifiedEmptyState - Consistent empty state component for all list views
 * Reduces code duplication across the app
 */

import { ReactNode } from "react";
import { motion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Music2,
  FolderOpen,
  ListMusic,
  Mic2,
  Search,
  MessageSquare,
  Bell,
  Heart,
  Sparkles,
  Plus,
  type LucideIcon,
} from "@/lib/icons";

export type EmptyStateType =
  | "tracks"
  | "projects"
  | "playlists"
  | "artists"
  | "search"
  | "comments"
  | "notifications"
  | "likes"
  | "stems"
  | "lyrics"
  | "lyrics_studio"
  | "stem_studio"
  | "custom";

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}

const emptyStateConfigs: Record<Exclude<EmptyStateType, "custom">, EmptyStateConfig> = {
  tracks: {
    icon: Music2,
    title: "Нет треков",
    description: "Создайте свой первый трек с помощью AI",
    actionLabel: "Создать трек",
    actionPath: "/generate",
  },
  projects: {
    icon: FolderOpen,
    title: "Нет проектов",
    description: "Объедините треки в альбом или EP",
    actionLabel: "Создать проект",
    actionPath: "/projects/new",
  },
  playlists: {
    icon: ListMusic,
    title: "Нет плейлистов",
    description: "Соберите любимые треки в плейлист",
    actionLabel: "Создать плейлист",
  },
  artists: {
    icon: Mic2,
    title: "Нет AI артистов",
    description: "Создайте уникального виртуального исполнителя",
    actionLabel: "Создать артиста",
    actionPath: "/artists/new",
  },
  search: {
    icon: Search,
    title: "Ничего не найдено",
    description: "Попробуйте изменить поисковый запрос",
  },
  comments: {
    icon: MessageSquare,
    title: "Нет комментариев",
    description: "Будьте первым, кто оставит комментарий",
  },
  notifications: {
    icon: Bell,
    title: "Нет уведомлений",
    description: "Здесь появятся ваши уведомления",
  },
  likes: {
    icon: Heart,
    title: "Нет избранного",
    description: "Отмечайте понравившиеся треки сердечком",
    actionLabel: "Открыть ленту",
    actionPath: "/",
  },
  stems: {
    icon: Sparkles,
    title: "Нет стемов",
    description: "Разделите трек на вокал и инструменты",
    actionLabel: "Разделить трек",
  },
  lyrics: {
    icon: Mic2,
    title: "Нет текстов",
    description: "Создайте или сохраните текст песни",
    actionLabel: "Создать текст",
  },
  lyrics_studio: {
    icon: Mic2,
    title: "Добро пожаловать в Lyrics Studio",
    description: "Создавайте, редактируйте и улучшайте тексты песен с помощью AI",
    actionLabel: "Создать первый текст",
  },
  stem_studio: {
    icon: Sparkles,
    title: "Добро пожаловать в Stem Studio",
    description: "Разделяйте треки на вокал, ударные, бас и другие инструменты",
    actionLabel: "Загрузить трек",
  },
};

interface UnifiedEmptyStateProps {
  type?: EmptyStateType;
  // Custom overrides
  icon?: LucideIcon | ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Alternative action object API (shim-friendly) */
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
  secondaryAction?: { label: string; onClick: () => void };
  // Styling
  className?: string;
  compact?: boolean;
  /** Size alias: 'sm' → compact, 'md' | 'lg' → default. */
  size?: "sm" | "md" | "lg";
  // Custom content
  children?: ReactNode;
}

function isLucideIcon(value: unknown): value is LucideIcon {
  return typeof value === "function";
}

export function UnifiedEmptyState({
  type = "custom",
  icon: customIcon,
  title: customTitle,
  description: customDescription,
  actionLabel: customActionLabel,
  onAction,
  action,
  secondaryAction,
  className,
  compact: compactProp,
  size,
  children,
}: UnifiedEmptyStateProps) {
  const config = type !== "custom" ? emptyStateConfigs[type] : null;

  const compact = compactProp ?? size === "sm";

  const iconCandidate = customIcon ?? config?.icon ?? Sparkles;
  const Icon = isLucideIcon(iconCandidate) ? iconCandidate : null;
  const iconNode = !Icon ? (iconCandidate as ReactNode) : null;
  const title = customTitle || config?.title || "Пусто";
  const description = customDescription || config?.description || "";
  const actionLabel = customActionLabel || action?.label || config?.actionLabel;
  const handleAction = onAction || action?.onClick;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-16 px-6",
        className,
      )}
    >
      {/* Icon with animated background - theme-aware */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
        className={cn(
          "relative rounded-full flex items-center justify-center",
          "bg-muted/60 dark:bg-muted/40",
          compact ? "w-12 h-12 mb-3" : "w-16 h-16 mb-4",
        )}
      >
        {Icon ? (
          <Icon className={cn("text-muted-foreground", compact ? "w-6 h-6" : "w-8 h-8")} />
        ) : (
          <span className={cn("text-muted-foreground inline-flex items-center justify-center")}>{iconNode}</span>
        )}

        {/* Subtle pulse effect - reduced motion respects */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/5 dark:bg-primary/10"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className={cn("font-semibold text-foreground", compact ? "text-sm mb-1" : "text-base mb-2")}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn("text-muted-foreground max-w-xs", compact ? "text-xs" : "text-sm")}
        >
          {description}
        </motion.p>
      )}

      {/* Action button */}
      {actionLabel && handleAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn("flex flex-wrap items-center justify-center gap-2", compact ? "mt-3" : "mt-5")}
        >
          <Button onClick={handleAction} size={compact ? "sm" : "default"} className="gap-2">
            {action?.icon ? <action.icon className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {actionLabel}
          </Button>
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} size={compact ? "sm" : "default"} variant="outline">
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}

      {/* Custom children */}
      {children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className={compact ? "mt-3" : "mt-5"}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

// Convenience exports for common use cases
export const TracksEmptyState = (props: Omit<UnifiedEmptyStateProps, "type">) => (
  <UnifiedEmptyState type="tracks" {...props} />
);

export const ProjectsEmptyState = (props: Omit<UnifiedEmptyStateProps, "type">) => (
  <UnifiedEmptyState type="projects" {...props} />
);

export const PlaylistsEmptyState = (props: Omit<UnifiedEmptyStateProps, "type">) => (
  <UnifiedEmptyState type="playlists" {...props} />
);

export const SearchEmptyState = (props: Omit<UnifiedEmptyStateProps, "type">) => (
  <UnifiedEmptyState type="search" {...props} />
);
