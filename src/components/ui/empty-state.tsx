/**
 * EmptyState — shared empty-state primitive.
 * Use to communicate "nothing here yet" scenarios consistently.
 */
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center gap-2",
        compact ? "p-4" : "p-8",
        className,
      )}
    >
      {Icon && (
        <div className={cn("rounded-full bg-muted/40 flex items-center justify-center", compact ? "w-10 h-10" : "w-14 h-14")}>
          <Icon className={cn(compact ? "w-5 h-5" : "w-7 h-7", "text-muted-foreground")} />
        </div>
      )}
      <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>{title}</p>
      {description && <p className="text-xs text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
