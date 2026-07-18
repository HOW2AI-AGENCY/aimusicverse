import { memo } from "react";
import { motion } from "@/lib/motion";
import { Clock, RefreshCw } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimeoutErrorStateProps {
  message?: string;
  elapsedSeconds?: number;
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
}

export const TimeoutErrorState = memo(function TimeoutErrorState({
  message = "Запрос выполняется слишком долго",
  elapsedSeconds,
  onRetry,
  onGoBack,
  className,
}: TimeoutErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center min-h-[350px] px-6 text-center", className)}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-5"
      >
        <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Clock className="w-9 h-9 text-blue-500 dark:text-blue-400" />
        </div>
      </motion.div>

      <h2 className="text-lg font-semibold text-foreground mb-1.5">Таймаут запроса</h2>
      <p className="text-sm text-muted-foreground mb-2 max-w-xs leading-relaxed">{message}</p>

      {elapsedSeconds !== undefined && (
        <p className="text-xs text-muted-foreground/70 mb-6">
          Прошло {elapsedSeconds} сек — возможно, сервер перегружен
        </p>
      )}

      <div className="flex gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Повторить
          </Button>
        )}
        {onGoBack && (
          <Button onClick={onGoBack} variant="outline" size="sm">
            Назад
          </Button>
        )}
      </div>
    </motion.div>
  );
});
