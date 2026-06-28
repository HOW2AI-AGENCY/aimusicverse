import { memo } from "react";
import { motion } from "@/lib/motion";
import { ServerCrash, RefreshCw, Bug } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServerErrorStateProps {
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onReport?: () => void;
  className?: string;
}

export const ServerErrorState = memo(function ServerErrorState({
  message = "Произошла ошибка на сервере",
  onRetry,
  onGoBack,
  onReport,
  className,
}: ServerErrorStateProps) {
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
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <ServerCrash className="w-9 h-9 text-red-500 dark:text-red-400" />
        </div>
      </motion.div>

      <h2 className="text-lg font-semibold text-foreground mb-1.5">Ошибка сервера</h2>
      <p className="text-sm text-muted-foreground mb-2 max-w-xs leading-relaxed">{message}</p>

      {onReport && (
        <button
          onClick={onReport}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <Bug className="w-3.5 h-3.5" />
          Сообщить о проблеме
        </button>
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
