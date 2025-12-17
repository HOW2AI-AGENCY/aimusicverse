/**
 * GenerateButton - Smart generation button with progress and estimation
 */

import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerateButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  isLiveMode: boolean;
  disabled?: boolean;
  hasCachedResult?: boolean;
  estimatedTime?: number; // in seconds
  className?: string;
}

export const GenerateButton = memo(function GenerateButton({
  onClick,
  isGenerating,
  isLiveMode,
  disabled,
  hasCachedResult,
  estimatedTime = 15,
  className,
}: GenerateButtonProps) {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Simulate progress when generating
  useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedTime(Math.floor(elapsed));
      
      // Logarithmic progress that never quite reaches 100%
      const prog = Math.min(95, (1 - Math.exp(-elapsed / (estimatedTime * 0.7))) * 100);
      setProgress(prog);
    }, 100);

    return () => clearInterval(interval);
  }, [isGenerating, estimatedTime]);

  const remainingTime = Math.max(0, estimatedTime - elapsedTime);

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        'relative h-10 w-10 rounded-full overflow-hidden',
        'border-purple-500/30 hover:bg-purple-500/20',
        hasCachedResult && !isGenerating && 'border-green-500/50',
        className
      )}
      onClick={onClick}
      disabled={disabled || isGenerating || isLiveMode}
      title={hasCachedResult ? 'Загрузить из кэша' : 'Сгенерировать трек'}
    >
      {/* Progress ring */}
      <AnimatePresence>
        {isGenerating && (
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 40 40"
          >
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted/20"
            />
            <motion.circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-purple-500"
              strokeDasharray={113}
              strokeDashoffset={113 - (113 * progress) / 100}
              transition={{ duration: 0.1 }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Icon */}
      <div className="relative z-10">
        {isGenerating ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            {remainingTime > 0 && (
              <span className="text-[8px] font-mono mt-0.5">{remainingTime}s</span>
            )}
          </div>
        ) : hasCachedResult ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>
    </Button>
  );
});
