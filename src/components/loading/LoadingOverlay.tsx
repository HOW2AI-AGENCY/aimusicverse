/**
 * LoadingOverlay - Unified loading overlay component
 * Uses FixedOverlay for consistent centering and safe areas
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { FixedOverlay } from '@/components/layout/FixedOverlay';
import { CSSEqualizer } from './CSSEqualizer';

export type LoadingOverlayVariant = 'fullscreen' | 'blur' | 'inline';

interface LoadingOverlayProps {
  variant?: LoadingOverlayVariant;
  message?: string;
  progress?: number;
  showEqualizer?: boolean;
  className?: string;
}

/**
 * Unified loading overlay with GPU-accelerated animations
 */
export const LoadingOverlay = memo(function LoadingOverlay({
  variant = 'fullscreen',
  message,
  progress,
  showEqualizer = true,
  className,
}: LoadingOverlayProps) {
  // Inline variant - no overlay
  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 gap-4', className)}>
        {showEqualizer ? (
          <CSSEqualizer size="md" />
        ) : (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        
        {progress !== undefined && <ProgressBar progress={progress} />}
        
        {message && (
          <p className="text-sm text-muted-foreground text-center">{message}</p>
        )}
      </div>
    );
  }
  
  // Fullscreen or blur variants
  return (
    <FixedOverlay
      center
      background={variant === 'blur' ? 'blur' : 'solid'}
      zIndex="fullscreen"
      className={className}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        {showEqualizer ? (
          <CSSEqualizer size="md" />
        ) : (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        
        {progress !== undefined && <ProgressBar progress={progress} />}
        
        {message && (
          <p className="text-sm text-muted-foreground text-center max-w-xs">{message}</p>
        )}
      </div>
    </FixedOverlay>
  );
});

/**
 * Progress bar component for loading states
 */
const ProgressBar = memo(function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-40">
      <div 
        className="h-1 bg-muted/50 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div 
          className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center mt-1 tabular-nums">
        {Math.round(progress)}%
      </p>
    </div>
  );
});

export default LoadingOverlay;
