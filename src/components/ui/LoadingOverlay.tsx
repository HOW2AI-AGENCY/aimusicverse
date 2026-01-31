/**
 * Loading Overlay Component
 * Feature: 032-professional-ui
 * 
 * Full-screen and section loading overlays
 */

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Loader2, Music, Sparkles } from 'lucide-react';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  submessage?: string;
  variant?: 'default' | 'blur' | 'solid' | 'gradient';
  icon?: 'spinner' | 'music' | 'sparkles' | ReactNode;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({
  visible,
  message,
  submessage,
  variant = 'blur',
  icon = 'spinner',
  fullScreen = false,
  className,
}: LoadingOverlayProps) {
  const variantStyles = {
    default: 'bg-background/80',
    blur: 'bg-background/60 backdrop-blur-md',
    solid: 'bg-background',
    gradient: 'bg-gradient-to-b from-background/90 via-background/70 to-background/90 backdrop-blur-sm',
  };

  const IconComponent = () => {
    if (typeof icon !== 'string') return <>{icon}</>;
    
    switch (icon) {
      case 'music':
        return (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Music className="w-10 h-10 text-primary" />
          </motion.div>
        );
      case 'sparkles':
        return (
          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-10 h-10 text-primary" />
          </motion.div>
        );
      default:
        return <Loader2 className="w-10 h-10 text-primary animate-spin" />;
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex flex-col items-center justify-center gap-4",
            "z-50",
            variantStyles[variant],
            fullScreen ? "fixed inset-0" : "absolute inset-0",
            className
          )}
        >
          <IconComponent />
          
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <p className="text-foreground font-medium">{message}</p>
              {submessage && (
                <p className="text-sm text-muted-foreground mt-1">{submessage}</p>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Progress Overlay - With progress bar
 */
interface ProgressOverlayProps extends Omit<LoadingOverlayProps, 'icon'> {
  progress: number; // 0-100
  showPercentage?: boolean;
}

export function ProgressOverlay({
  visible,
  progress,
  message,
  submessage,
  showPercentage = true,
  variant = 'blur',
  fullScreen = false,
  className,
}: ProgressOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "flex flex-col items-center justify-center gap-4 p-8",
            "z-50",
            variant === 'blur' && "bg-background/60 backdrop-blur-md",
            variant === 'solid' && "bg-background",
            fullScreen ? "fixed inset-0" : "absolute inset-0",
            className
          )}
        >
          <div className="w-full max-w-xs">
            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            
            {/* Percentage */}
            {showPercentage && (
              <motion.p
                key={Math.floor(progress)}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm font-medium text-foreground mt-2"
              >
                {Math.round(progress)}%
              </motion.p>
            )}
          </div>
          
          {message && (
            <div className="text-center">
              <p className="text-foreground font-medium">{message}</p>
              {submessage && (
                <p className="text-sm text-muted-foreground mt-1">{submessage}</p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Skeleton Overlay - For content loading
 */
interface SkeletonOverlayProps {
  visible: boolean;
  rows?: number;
  className?: string;
}

export function SkeletonOverlay({
  visible,
  rows = 3,
  className,
}: SkeletonOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute inset-0 bg-background/90 backdrop-blur-sm",
            "flex flex-col gap-3 p-4",
            "z-40",
            className
          )}
        >
          {Array.from({ length: rows }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoadingOverlay;
