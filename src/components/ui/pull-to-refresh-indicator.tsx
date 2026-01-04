import { memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  isPulling: boolean;
  progress: number;
  threshold?: number;
  className?: string;
}

/**
 * Visual indicator for pull-to-refresh functionality
 */
export const PullToRefreshIndicator = memo(function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isPulling,
  progress,
  threshold = 80,
  className,
}: PullToRefreshIndicatorProps) {
  const isReady = progress >= 1;

  return (
    <AnimatePresence>
      {(isPulling || isRefreshing) && pullDistance > 10 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: Math.min(1, progress * 2), 
            y: Math.min(pullDistance - 20, threshold - 20),
          }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none",
            className
          )}
        >
          <div 
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              "bg-background/95 backdrop-blur-sm border shadow-lg",
              "transition-colors duration-200",
              isReady && "border-primary bg-primary/10"
            )}
          >
            {isRefreshing ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <motion.div
                animate={{ 
                  rotate: isReady ? 180 : 0,
                  scale: isReady ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <ArrowDown 
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isReady ? "text-primary" : "text-muted-foreground"
                  )} 
                />
              </motion.div>
            )}
          </div>
          
          {/* Progress ring */}
          {!isRefreshing && (
            <svg 
              className="absolute inset-0 w-10 h-10 -rotate-90"
              viewBox="0 0 40 40"
            >
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary/20"
              />
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${progress * 113} 113`}
                className="text-primary transition-all duration-100"
              />
            </svg>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
