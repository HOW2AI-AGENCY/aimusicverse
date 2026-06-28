import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { AlertCircle, RefreshCw } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimeoutIndicatorProps {
  visible: boolean;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
}

export const TimeoutIndicator = memo(function TimeoutIndicator({
  visible,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
  className,
}: TimeoutIndicatorProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(timer);
  }, [visible]);

  const canRetry = onRetry && retryCount < maxRetries;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl",
            "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60",
            className,
          )}
        >
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Загрузка затянулась</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Возможно, сервер перегружен
              {retryCount > 0 && ` (попытка ${retryCount}/${maxRetries})`}
            </p>
          </div>
          {canRetry && (
            <Button onClick={onRetry} size="sm" variant="outline" className="shrink-0 gap-1.5 text-xs h-8">
              <RefreshCw className="w-3.5 h-3.5" />
              Повторить
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
