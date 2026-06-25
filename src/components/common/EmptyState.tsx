/**
 * @deprecated Use `UnifiedEmptyState` from `@/components/ui/unified-empty-state`.
 * Thin compatibility shim — preserved API, delegates rendering to the canonical
 * `UnifiedEmptyState`. Will be removed in Phase 10 of `docs/UI_AUDIT.md`.
 */
import type { LucideIcon } from "lucide-react";
import { UnifiedEmptyState } from "@/components/ui/unified-empty-state";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  className?: string;
  variant?: "default" | "compact" | "card";
  animated?: boolean;
}

export function EmptyState({ icon, title, description, actions, className, variant = "default" }: EmptyStateProps) {
  const [primary, secondary] = actions ?? [];

  return (
    <UnifiedEmptyState
      type="custom"
      icon={icon}
      title={title}
      description={description}
      compact={variant !== "default"}
      action={primary ? { label: primary.label, onClick: primary.onClick, icon: primary.icon } : undefined}
      secondaryAction={secondary ? { label: secondary.label, onClick: secondary.onClick } : undefined}
      className={className}
    />
  );
}

export default EmptyState;
