/**
 * Unified EmptyState Component
 * Sprint 038-A: Foundation — replaces empty-state.tsx, unified-empty-state.tsx
 *
 * One component to rule all empty/error/not-found states with variant-driven
 * presets, configurable action buttons, and framer-motion fade-in.
 */
import React, { type ReactNode } from "react";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Search, Library, Music2, FolderOpen, Disc3, ListMusic, AlertTriangle, type LucideIcon } from "@/lib/icons";

// ── Types ──────────────────────────────────────────────────────────
export type EmptyStateVariant =
  | "search"
  | "library"
  | "tracks"
  | "projects"
  | "generations"
  | "artists"
  | "playlists"
  | "error";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  /** Preset variant that fills icon + title + description when not provided */
  variant?: EmptyStateVariant;
  /** Custom icon override (takes precedence over variant icon) */
  icon?: LucideIcon | ReactNode;
  title?: string;
  description?: string;
  /** Primary CTA */
  action?: EmptyStateAction;
  /** Secondary CTA rendered below the primary */
  secondaryAction?: { label: string; onClick: () => void };
  /** sm = inline card, md = section, lg = full-page hero */
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
}

// ── Preset mappings ────────────────────────────────────────────────
const VARIANT_DEFAULTS: Record<EmptyStateVariant, { icon: LucideIcon; title: string; description: string }> = {
  search: {
    icon: Search,
    title: "Nothing found",
    description: "Try changing your search query or filters",
  },
  library: {
    icon: Library,
    title: "Library is empty",
    description: "Create your first track with AI",
  },
  tracks: {
    icon: Music2,
    title: "No tracks",
    description: "Your music tracks will appear here",
  },
  projects: {
    icon: FolderOpen,
    title: "No projects",
    description: "Create your first project",
  },
  generations: {
    icon: Disc3,
    title: "No generations yet",
    description: "Generate your first AI track",
  },
  artists: {
    icon: Music2,
    title: "No artists",
    description: "Artists you follow will appear here",
  },
  playlists: {
    icon: ListMusic,
    title: "No playlists",
    description: "Create a playlist to organize your tracks",
  },
  error: {
    icon: AlertTriangle,
    title: "Something went wrong",
    description: "Please try again later",
  },
};

// ── Size tokens ─────────────────────────────────────────────────────
const SIZE_CLASSES: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  sm: "gap-2 p-4 text-sm",
  md: "gap-4 p-6",
  lg: "gap-6 p-10 text-lg",
};

const ICON_SIZES: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

// ── Component ───────────────────────────────────────────────────────
export function EmptyState({
  variant = "search",
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
  children,
}: EmptyStateProps) {
  const preset = VARIANT_DEFAULTS[variant];
  const resolvedIcon = icon ?? preset.icon;
  const resolvedTitle = title ?? preset.title;
  const resolvedDescription = description ?? preset.description;

  const IconComponent = resolvedIcon && typeof resolvedIcon !== "object" ? (resolvedIcon as LucideIcon) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-2xl",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {/* Icon */}
      {IconComponent ? (
        <div className={cn("text-muted-foreground/60", ICON_SIZES[size])}>
          <IconComponent className="w-full h-full" strokeWidth={1.5} />
        </div>
      ) : resolvedIcon ? (
        <div className={cn("text-muted-foreground/60", ICON_SIZES[size])}>{resolvedIcon as ReactNode}</div>
      ) : null}

      {/* Title */}
      {resolvedTitle && (
        <p
          className={cn(
            "font-semibold text-foreground",
            size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base",
          )}
        >
          {resolvedTitle}
        </p>
      )}

      {/* Description */}
      {resolvedDescription && (
        <p
          className={cn(
            "text-muted-foreground max-w-sm",
            size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm",
          )}
        >
          {resolvedDescription}
        </p>
      )}

      {/* Primary Action */}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            action.variant === "secondary"
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              : action.variant === "outline"
                ? "border border-border bg-transparent hover:bg-muted"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </button>
      )}

      {/* Secondary Action */}
      {secondaryAction && (
        <button
          type="button"
          onClick={secondaryAction.onClick}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        >
          {secondaryAction.label}
        </button>
      )}

      {children}
    </motion.div>
  );
}

export default EmptyState;
