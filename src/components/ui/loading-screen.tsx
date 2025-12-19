import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion, fadeIn } from '@/lib/motion';

interface LoadingScreenProps {
  className?: string;
  message?: string;
  progress?: number;
  variant?: 'fullscreen' | 'inline' | 'overlay';
}

export function LoadingScreen({ 
  className, 
  message = 'Загрузка...', 
  progress,
  variant = 'fullscreen'
}: LoadingScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  
  const containerClasses = {
    fullscreen: 'flex min-h-screen items-center justify-center bg-background',
    inline: 'flex items-center justify-center py-12',
    overlay: 'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
  };
  
  return (
    <motion.div 
      className={cn(containerClasses[variant], className)}
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 
            className="h-8 w-8 animate-spin text-primary" 
            aria-hidden="true"
          />
          {progress !== undefined && (
            <svg 
              className="absolute inset-0 -rotate-90 h-8 w-8"
              viewBox="0 0 32 32"
              aria-hidden="true"
            >
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary/20"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${progress * 0.88} 88`}
                className="text-primary transition-all duration-300"
              />
            </svg>
          )}
        </div>
        
        {message && (
          <p className="text-sm text-muted-foreground" aria-label={message}>
            {message}
          </p>
        )}
        
        {progress !== undefined && (
          <div className="w-48">
            <div 
              className="h-1 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div 
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Inline loading spinner for buttons and small areas
 */
export function LoadingSpinner({ 
  size = 'sm',
  className 
}: { 
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)} 
      aria-hidden="true"
    />
  );
}

/**
 * Pulse dot loading indicator
 */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)} role="status" aria-label="Загрузка">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}
