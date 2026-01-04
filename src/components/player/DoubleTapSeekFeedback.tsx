/**
 * Double Tap Seek Feedback Component
 * 
 * Visual feedback for double-tap seek gesture
 * Shows rotation icon and seek amount
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { RotateCcw, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DoubleTapSeekFeedbackProps {
  side: 'left' | 'right';
  seekAmount?: number;
}

export const DoubleTapSeekFeedback = memo(function DoubleTapSeekFeedback({
  side,
  seekAmount = 10,
}: DoubleTapSeekFeedbackProps) {
  const Icon = side === 'left' ? RotateCcw : RotateCw;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none',
        side === 'left' ? 'left-12' : 'right-12'
      )}
    >
      <div className="bg-black/60 backdrop-blur-md rounded-full p-5 flex flex-col items-center shadow-lg">
        <Icon className="w-8 h-8 text-white" />
        <span className="text-white text-sm font-semibold mt-1">{seekAmount}</span>
      </div>
    </motion.div>
  );
});
