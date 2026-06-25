/**
 * @deprecated Use `UnifiedEmptyState` from `@/components/ui/unified-empty-state`.
 * Thin compatibility shim. Removed in Phase 10 of `docs/UI_AUDIT.md`.
 */
import { memo, type ReactNode } from "react";
import type { LucideIcon } from "@/lib/icons";
import { UnifiedEmptyState } from "@/components/ui/unified-empty-state";

export type EmptyStateVariant = "default" | "search" | "error" | "success" | "music" | "loading";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost";
    icon?: LucideIcon;
  };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
  children?: ReactNode;
  compact?: boolean;
  animate?: boolean;
  variant?: EmptyStateVariant;
  emoji?: string;
}

export const EmptyState = memo(function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
  compact = false,
  emoji,
}: EmptyStateProps) {
  const iconNode: ReactNode | LucideIcon | undefined = emoji ? (
    <span className="text-3xl" aria-hidden="true">
      {emoji}
    </span>
  ) : (
    icon
  );

  return (
    <UnifiedEmptyState
      type="custom"
      icon={iconNode}
      title={title}
      description={description}
      action={action ? { label: action.label, onClick: action.onClick, icon: action.icon } : undefined}
      secondaryAction={secondaryAction}
      compact={compact}
      className={className}
    >
      {children}
    </UnifiedEmptyState>
  );
});

export default EmptyState;
