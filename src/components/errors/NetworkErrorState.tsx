import { memo } from "react";
import { motion } from "@/lib/motion";
import { Wifi, WifiOff, RefreshCw } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NetworkErrorStateProps {
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
}

export const NetworkErrorState = memo(function NetworkErrorState({
  message = "Нет подключения к интернету",
  onRetry,
  onGoBack,
  className,
}: NetworkErrorStateProps) {
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
        className="relative mb-5"
      >
        <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <WifiOff className="w-9 h-9 text-orange-500 dark:text-orange-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-muted flex items-center justify-center">
          <Wifi className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </motion.div>

      <h2 className="text-lg font-semibold text-foreground mb-1.5">Нет подключения</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">{message}</p>

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
