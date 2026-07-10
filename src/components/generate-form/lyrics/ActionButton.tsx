/**
 * ActionButton Component for LyricsVisualEditorCompact
 * Sprint 051 — Test Debt + God Files Decomposition
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "@/lib/icons";

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: LucideIcon;
  destructive?: boolean;
  variant?: "primary" | "secondary";
}

export const ActionButton = memo(function ActionButton({
  label,
  onClick,
  disabled = false,
  icon: Icon,
  destructive = false,
  variant = "secondary",
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
        "hover:scale-[1.02] ",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        destructive
          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : variant === "primary"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-accent text-accent-foreground hover:bg-accent/80",
      )}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
});
