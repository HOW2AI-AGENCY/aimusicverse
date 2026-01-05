/**
 * PlayingIndicator - Animated equalizer bars for playing state
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';

interface PlayingIndicatorProps {
  className?: string;
  barCount?: number;
  color?: string;
}

export const PlayingIndicator = memo(function PlayingIndicator({
  className = '',
  barCount = 3,
  color = 'bg-primary',
}: PlayingIndicatorProps) {
  return (
    <div className={`flex items-end justify-center gap-0.5 h-4 w-4 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${color}`}
          animate={{
            height: ['40%', '100%', '60%', '100%', '40%'],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});
