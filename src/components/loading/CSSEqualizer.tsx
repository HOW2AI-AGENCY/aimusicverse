/**
 * CSSEqualizer - GPU-accelerated equalizer animation
 * Pure CSS for minimal JS overhead and fast first paint
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

export type EqualizerSize = 'sm' | 'md' | 'lg';

interface CSSEqualizerProps {
  size?: EqualizerSize;
  className?: string;
  barCount?: number;
}

const sizeMap: Record<EqualizerSize, { height: string; barWidth: string; gap: string }> = {
  sm: { height: 'h-5', barWidth: 'w-0.5', gap: 'gap-0.5' },
  md: { height: 'h-8', barWidth: 'w-1', gap: 'gap-1' },
  lg: { height: 'h-10', barWidth: 'w-1.5', gap: 'gap-1.5' },
};

/**
 * CSS-only equalizer animation for loading states
 * Uses GPU-accelerated transforms for smooth 60fps
 */
export const CSSEqualizer = memo(function CSSEqualizer({
  size = 'md',
  className,
  barCount = 5,
}: CSSEqualizerProps) {
  const sizes = sizeMap[size];
  
  return (
    <div 
      className={cn(
        'flex items-end justify-center',
        sizes.height,
        sizes.gap,
        className
      )}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            sizes.barWidth,
            'rounded-full bg-gradient-to-t from-primary to-primary/50 will-change-transform'
          )}
          style={{
            animation: 'equalizer 0.6s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
            height: '4px',
          }}
        />
      ))}
      <style>{`
        @keyframes equalizer {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(4); }
        }
      `}</style>
    </div>
  );
});

export default CSSEqualizer;
