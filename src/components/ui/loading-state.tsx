/**
 * LoadingState - Unified loading state component
 * Provides consistent loading UI across the app
 */

import { memo, ReactNode } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { loadingStates } from '@/lib/design-tokens';
import { Loader2 } from '@/lib/icons';
import { CSSEqualizer } from '@/components/loading/CSSEqualizer';

type LoadingVariant = 'spinner' | 'equalizer' | 'skeleton' | 'dots';
type LoadingSize = 'sm' | 'md' | 'lg';

interface LoadingStateProps {
  /** Loading variant */
  variant?: LoadingVariant;
  /** Size of the loader */
  size?: LoadingSize;
  /** Optional text to display */
  text?: string;
  /** Full screen overlay mode */
  fullScreen?: boolean;
  /** Inline mode (no centering) */
  inline?: boolean;
  /** Custom className */
  className?: string;
  /** Custom children to display with loading */
  children?: ReactNode;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const LoadingState = memo(function LoadingState({
  variant = 'spinner',
  size = 'md',
  text,
  fullScreen = false,
  inline = false,
  className,
  children,
}: LoadingStateProps) {
  const renderLoader = () => {
    switch (variant) {
      case 'equalizer':
        return <CSSEqualizer className={cn(sizeClasses[size])} />;
        
      case 'dots':
        return (
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className={cn('rounded-full bg-primary', 
                  size === 'sm' && 'w-1.5 h-1.5',
                  size === 'md' && 'w-2 h-2',
                  size === 'lg' && 'w-3 h-3'
                )}
                animate={{ y: [-2, 2, -2] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        );
        
      case 'skeleton':
        return (
          <div className="space-y-3 w-full max-w-sm">
            <div className={loadingStates.skeletonLine} />
            <div className={loadingStates.skeletonShort} />
            <div className={loadingStates.skeletonLine} />
          </div>
        );
        
      case 'spinner':
      default:
        return (
          <Loader2 className={cn(
            'animate-spin text-muted-foreground',
            sizeClasses[size]
          )} />
        );
    }
  };
  
  if (inline) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        {renderLoader()}
        {text && <span className={cn('text-muted-foreground', textSizeClasses[size])}>{text}</span>}
        {children}
      </span>
    );
  }
  
  if (fullScreen) {
    return (
      <div className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'bg-background/80 backdrop-blur-sm',
        className
      )}>
        {renderLoader()}
        {text && (
          <p className={cn('mt-4 text-muted-foreground', textSizeClasses[size])}>
            {text}
          </p>
        )}
        {children}
      </div>
    );
  }
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-8',
      className
    )}>
      {renderLoader()}
      {text && (
        <p className={cn('mt-3 text-muted-foreground', textSizeClasses[size])}>
          {text}
        </p>
      )}
      {children}
    </div>
  );
});

// Skeleton components for specific use cases
export const SkeletonCard = memo(function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
      <div className={loadingStates.skeletonLine} />
      <div className={loadingStates.skeletonShort} />
      <div className="flex gap-2">
        <div className={cn(loadingStates.skeletonCircle, 'w-8 h-8')} />
        <div className="flex-1 space-y-1.5">
          <div className={loadingStates.skeletonShort} />
          <div className={cn(loadingStates.skeletonLine, 'h-3')} />
        </div>
      </div>
    </div>
  );
});

export const SkeletonList = memo(function SkeletonList({ 
  count = 3, 
  className 
}: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <div className={cn(loadingStates.skeletonCircle, 'w-10 h-10 shrink-0')} />
          <div className="flex-1 space-y-2">
            <div className={loadingStates.skeletonShort} />
            <div className={cn(loadingStates.skeletonLine, 'h-3')} />
          </div>
        </div>
      ))}
    </div>
  );
});

export const SkeletonGrid = memo(function SkeletonGrid({ 
  count = 6, 
  className 
}: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className={cn(loadingStates.skeletonCard, 'aspect-square')} />
          <div className={loadingStates.skeletonShort} />
          <div className={cn(loadingStates.skeletonLine, 'h-3')} />
        </div>
      ))}
    </div>
  );
});

export default LoadingState;
