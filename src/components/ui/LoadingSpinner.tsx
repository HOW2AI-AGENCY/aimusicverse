/**
 * Unified loading spinner component for consistent loading states
 */
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { Music2, Loader2 } from 'lucide-react';

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

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  text,
  className,
}: LoadingSpinnerProps) {
  if (variant === 'minimal') {
    return (
      <Loader2 
        className={cn(
          sizeClasses[size],
          'animate-spin text-primary',
          className
        )} 
      />
    );
  }

  if (variant === 'music') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <motion.div
          className={cn(
            'rounded-full bg-primary/10 flex items-center justify-center',
            containerSizes[size]
          )}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Music2 className={cn(sizeClasses[size], 'text-primary')} />
        </motion.div>
        {text && (
          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          sizeClasses[size],
          'animate-spin rounded-full border-2 border-primary border-t-transparent'
        )}
      />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

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
export { CardSkeleton, TextSkeleton } from './skeleton-components';
