import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion, fadeIn } from '@/lib/motion';
import logo from '@/assets/logo.png';

interface LoadingScreenProps {
  className?: string;
  message?: string;
  progress?: number;
  variant?: 'fullscreen' | 'inline' | 'overlay';
  showLogo?: boolean;
}

// Equalizer bar animation
const EqualizerBar = ({ delay = 0, maxHeight = 24 }: { delay?: number; maxHeight?: number }) => (
  <motion.div
    className="w-1 bg-gradient-to-t from-primary to-primary/60 rounded-full"
    initial={{ height: 6 }}
    animate={{ 
      height: [6, maxHeight, 6],
    }}
    transition={{
      duration: 0.7,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  />
);

export function LoadingScreen({ 
  className, 
  message = 'Загрузка...', 
  progress,
  variant = 'fullscreen',
  showLogo = true
}: LoadingScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  
  const containerClasses = {
    fullscreen: 'fixed inset-0 flex items-center justify-center bg-background z-50',
    inline: 'flex items-center justify-center py-12',
    overlay: 'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md',
  };
  
  return (
    <motion.div 
      className={cn(containerClasses[variant], className)}
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Background effects */}
      {variant === 'fullscreen' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-generate/5 rounded-full blur-3xl"
            animate={{
              x: [0, -50, 0],
              y: [0, -30, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* Logo with glow effect */}
        {showLogo && variant === 'fullscreen' && (
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <motion.div
              className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.img
              src={logo}
              alt="MusicVerse"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-2xl relative"
              animate={{ 
                scale: shouldReduceMotion ? 1 : [1, 1.03, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}

        {/* Equalizer animation */}
        {!shouldReduceMotion && (
          <motion.div
            className="flex items-end justify-center gap-1 h-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <EqualizerBar 
                key={i} 
                delay={i * 0.1} 
                maxHeight={14 + (i % 3) * 6}
              />
            ))}
          </motion.div>
        )}

        {/* Fallback spinner for reduced motion */}
        {shouldReduceMotion && (
          <Loader2 
            className="h-8 w-8 animate-spin text-primary" 
            aria-hidden="true"
          />
        )}
        
        {/* Progress indicator */}
        {progress !== undefined && (
          <div className="w-48">
            <div 
              className="h-1.5 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1.5">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Message */}
        {message && (
          <motion.p 
            className="text-sm text-muted-foreground text-center" 
            aria-label={message}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {message}
          </motion.p>
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
 * Musical dots loading indicator
 */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)} role="status" aria-label="Загрузка">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2.5 h-2.5 bg-primary rounded-full"
          animate={{ 
            y: [-3, 3, -3],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton with shimmer animation
 */
export function SkeletonShimmer({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-muted", className)}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ translateX: ['100%', '-100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
