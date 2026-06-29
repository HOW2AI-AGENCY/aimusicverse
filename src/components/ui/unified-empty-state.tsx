/**
 * UnifiedEmptyState - canonical empty state component.
 * Renders an icon, title, optional description and up to two actions.
 */
import type { LucideIcon } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionConfig {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

export interface UnifiedEmptyStateProps {
  type?: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  compact?: boolean;
  action?: ActionConfig;
  secondaryAction?: ActionConfig;
  className?: string;
}

export function UnifiedEmptyState({
  icon: Icon,
  title,
  description,
  compact = false,
  action,
  secondaryAction,
  className,
}: UnifiedEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6 gap-2" : "py-12 gap-4",
        className,
      )}
    >
      {Icon ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
            compact ? "h-10 w-10" : "h-14 w-14",
          )}
        >
          <Icon className={compact ? "h-5 w-5" : "h-7 w-7"} />
        </div>
      ) : null}

      <div className="space-y-1">
        <h3 className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>{title}</h3>
        {description ? (
          <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>{description}</p>
        ) : null}
      </div>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {action ? (
            <Button onClick={action.onClick} size={compact ? "sm" : "default"}>
              {action.icon ? <action.icon className="mr-2 h-4 w-4" /> : null}
              {action.label}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button onClick={secondaryAction.onClick} variant="outline" size={compact ? "sm" : "default"}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default UnifiedEmptyState;
