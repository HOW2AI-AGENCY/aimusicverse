/**
 * Unified loading spinner component for consistent loading states
 * 
 * OPTIMIZED: Uses pure CSS animations instead of framer-motion
 * for faster initial paint and reduced JS bundle.
 */
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Music2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'music' | 'minimal';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const containerSizes = {
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
  xl: 'p-6',
};

export const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  variant = 'default',
  text,
  className,
}: LoadingSpinnerProps) {
  // Minimal variant - pure CSS spinner
  if (variant === 'minimal') {
    return (
      <div 
        className={cn(
          sizeClasses[size],
          'animate-spin rounded-full border-2 border-primary border-t-transparent',
          className
        )} 
        role="status"
        aria-label="Loading"
      />
    );
  }

  // Music variant - CSS pulse animation instead of framer-motion
  if (variant === 'music') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div
          className={cn(
            'rounded-full bg-primary/10 flex items-center justify-center css-pulse-scale',
            containerSizes[size]
          )}
          role="status"
          aria-label="Loading music"
        >
          <Music2 className={cn(sizeClasses[size], 'text-primary')} />
        </div>
        {text && (
          <p className="text-sm text-muted-foreground animate-fade-in">
            {text}
          </p>
        )}
      </div>
    );
  }

  // Default variant - simple CSS spinner
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          sizeClasses[size],
          'animate-spin rounded-full border-2 border-primary border-t-transparent'
        )}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
});

// Full page loading state
interface PageLoadingProps {
  text?: string;
}

export function PageLoading({ text = 'Загрузка...' }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" variant="music" text={text} />
    </div>
  );
}

// Section loading placeholder
interface SectionLoadingProps {
  height?: string;
  className?: string;
}

export function SectionLoading({ height = '120px', className }: SectionLoadingProps) {
  return (
    <div 
      className={cn(
        'flex items-center justify-center rounded-lg bg-muted/30',
        className
      )}
      style={{ minHeight: height }}
    >
      <LoadingSpinner size="md" variant="default" />
    </div>
  );
}

// Re-export consolidated skeletons from unified source
export { TrackCardSkeleton as CardSkeleton, TextSkeleton } from './skeleton-components';
