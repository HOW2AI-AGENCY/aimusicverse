/**
 * LoadingState — shared loading primitive.
 * Use for consistent "loading / buffering" UI across the app.
 */
import { Loader2 } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "inline" | "block" | "shimmer";
}

const sizeMap = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-6 h-6",
} as const;

export function LoadingState({ label, className, size = "md", variant = "inline" }: LoadingStateProps) {
  if (variant === "shimmer") {
    return (
      <div
        className={cn(
          "absolute inset-0 rounded-md overflow-hidden bg-primary/5 pointer-events-none",
          className,
        )}
        aria-hidden="true"
        role="status"
        aria-label={label ?? "Loading"}
      >
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/10">
          <div className="h-full w-1/3 bg-primary/70 animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 text-muted-foreground",
        variant === "block" && "justify-center p-6",
        className,
      )}
    >
      <Loader2 className={cn(sizeMap[size], "animate-spin text-primary")} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
