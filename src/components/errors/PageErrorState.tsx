/**
 * PageErrorState - Generic page-level error display with retry
 * Used as the standard error state pattern across all pages.
 */

import { memo } from "react";
import { AlertTriangle, RefreshCw } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageErrorStateProps {
  /** Error object or message */
  error: Error | string | unknown;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional className */
  className?: string;
  /** Custom title */
  title?: string;
}

export const PageErrorState = memo(function PageErrorState({
  error,
  onRetry,
  className,
  title = "Ошибка загрузки",
}: PageErrorStateProps) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Произошла непредвиденная ошибка";

  return (
    <div className={cn("min-h-[50vh] flex flex-col items-center justify-center gap-4 px-6 text-center", className)}>
      <div className="p-3 rounded-full bg-destructive/10">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 mt-2">
          <RefreshCw className="w-4 h-4" />
          Попробовать снова
        </Button>
      )}
    </div>
  );
});
