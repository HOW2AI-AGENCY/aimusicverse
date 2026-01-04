/**
 * TranscriptionInProgress - Indicator shown when transcription is running
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Music2, Loader2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranscriptionInProgressProps {
  stemType?: string;
  className?: string;
}

export const TranscriptionInProgress = memo(function TranscriptionInProgress({
  stemType = 'стема',
  className,
}: TranscriptionInProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg",
        "bg-gradient-to-r from-primary/10 to-amber-500/10",
        "border border-primary/20",
        className
      )}
    >
      <div className="relative">
        <Music2 className="w-4 h-4 text-primary" />
        <motion.div
          className="absolute -top-0.5 -right-0.5"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Wand2 className="w-2.5 h-2.5 text-amber-500" />
        </motion.div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-foreground truncate">
            Транскрипция...
          </span>
          <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />
        </div>
      </div>
    </motion.div>
  );
});

/**
 * TranscriptionPlaceholder - Shown when no transcription data available
 */
export const TranscriptionPlaceholder = memo(function TranscriptionPlaceholder({
  onTranscribe,
  className,
}: {
  onTranscribe?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onTranscribe}
      disabled={!onTranscribe}
      className={cn(
        "w-full flex items-center justify-center gap-2 p-2 rounded-lg",
        "bg-muted/30 border border-dashed border-muted-foreground/20",
        "text-muted-foreground text-[10px]",
        "hover:bg-muted/50 hover:border-primary/30 hover:text-foreground",
        "transition-all cursor-pointer disabled:cursor-default disabled:hover:bg-muted/30",
        className
      )}
    >
      <Music2 className="w-3.5 h-3.5" />
      <span>Получить ноты (MIDI)</span>
    </motion.button>
  );
});
