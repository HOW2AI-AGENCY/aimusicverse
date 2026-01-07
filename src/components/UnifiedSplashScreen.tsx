/**
 * UnifiedSplashScreen - Single unified splash/loading screen for the entire app
 * Replaces: SplashScreen.tsx, LoadingScreen, BrandedLoader
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from '@/lib/motion';
import { Loader2, Music2, Disc3 } from 'lucide-react';
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { APP_CONFIG } from '@/config/app.config';

export type SplashVariant = 'splash' | 'loading' | 'overlay' | 'inline' | 'minimal';

interface UnifiedSplashScreenProps {
  variant?: SplashVariant;
  message?: string;
  progress?: number;
  showLogo?: boolean;
  onComplete?: () => void;
  duration?: number;
  className?: string;
}

// Musical equalizer bar with smooth animation
const EqualizerBar = ({ delay = 0, maxHeight = 20, color = 'primary' }: { 
  delay?: number; 
  maxHeight?: number;
  color?: 'primary' | 'generate';
}) => (
  <motion.div
    className={cn(
      "w-1 rounded-full",
      color === 'primary' 
        ? "bg-gradient-to-t from-primary via-primary/80 to-primary/50" 
        : "bg-gradient-to-t from-generate via-generate/80 to-generate/50"
    )}
    initial={{ height: 4 }}
    animate={{ height: [4, maxHeight, 4] }}
    transition={{
      duration: 0.7,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  />
);

// Floating music notes effect
const FloatingNote = ({ delay = 0, x = 0 }: { delay?: number; x?: number }) => (
  <motion.div
    className="absolute text-primary/30"
    style={{ left: `${50 + x}%` }}
    initial={{ y: 100, opacity: 0, scale: 0.5 }}
    animate={{ 
      y: [-20, -60, -100],
      opacity: [0, 0.6, 0],
      scale: [0.5, 1, 0.8],
      rotate: [0, 15, -10],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      delay,
      ease: 'easeOut',
    }}
  >
    <Music2 className="w-4 h-4" />
  </motion.div>
);

// Spinning vinyl effect
const VinylDisc = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      className={cn("relative", sizeClasses[size])}
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    >
      <Disc3 className="w-full h-full text-primary/60" />
    </motion.div>
  );
};

export function UnifiedSplashScreen({
  variant = 'splash',
  message,
  progress,
  showLogo = true,
  onComplete,
  duration = 1200,
  className,
}: UnifiedSplashScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);

  // Auto-complete for splash variant
  useEffect(() => {
    if (variant === 'splash' && onComplete) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 300); // Wait for exit animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [variant, onComplete, duration]);

  // Container styles based on variant
  const containerClasses: Record<SplashVariant, string> = {
    splash: 'fixed inset-0 flex items-center justify-center bg-background z-[100]',
    loading: 'fixed inset-0 flex items-center justify-center bg-background z-50',
    overlay: 'fixed inset-0 flex items-center justify-center bg-background/90 backdrop-blur-xl z-50',
    inline: 'flex items-center justify-center py-16',
    minimal: 'flex items-center justify-center p-4',
  };

  // Get default message based on variant
  const defaultMessage = {
    splash: '',
    loading: 'Загрузка...',
    overlay: 'Подождите...',
    inline: 'Загрузка...',
    minimal: '',
  };

  const displayMessage = message ?? defaultMessage[variant];

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className={cn(containerClasses[variant], className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          {/* Animated background for splash/loading variants */}
          {(variant === 'splash' || variant === 'loading') && !shouldReduceMotion && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Primary gradient blob */}
              <motion.div
                className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-3xl"
                animate={{
                  x: [0, 60, 0],
                  y: [0, 40, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Secondary gradient blob */}
              <motion.div
                className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-generate/6 rounded-full blur-3xl"
                animate={{
                  x: [0, -50, 0],
                  y: [0, -30, 0],
                  scale: [1, 1.15, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Center pulse */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-primary/5 rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              {/* Floating music notes (splash only) */}
              {variant === 'splash' && (
                <>
                  <FloatingNote delay={0} x={-20} />
                  <FloatingNote delay={0.7} x={15} />
                  <FloatingNote delay={1.4} x={-10} />
                  <FloatingNote delay={2.1} x={25} />
                </>
              )}
            </div>
          )}

          {/* Main content */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-5"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Logo with glow effect */}
            {showLogo && (variant === 'splash' || variant === 'loading') && (
              <motion.div
                className="relative mb-2"
                animate={!shouldReduceMotion ? { scale: [1, 1.02, 1] } : undefined}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* Outer glow */}
                {!shouldReduceMotion && (
                  <motion.div
                    className="absolute -inset-6 rounded-[2rem] bg-primary/20 blur-2xl"
                    animate={{
                      scale: [1, 1.25, 1],
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                
                {/* Inner glow */}
                {!shouldReduceMotion && (
                  <motion.div
                    className="absolute -inset-3 rounded-3xl bg-primary/30 blur-xl"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                {/* Logo container */}
                <div className="relative p-3 rounded-3xl bg-card/80 backdrop-blur-sm border border-primary/20 shadow-2xl">
                  <img 
                    src={logo} 
                    alt="MusicVerse AI" 
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl" 
                  />
                </div>
              </motion.div>
            )}

            {/* App name for splash variant */}
            {variant === 'splash' && (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                <h1 className="text-3xl sm:text-4xl font-bold text-gradient mb-1">
                  MusicVerse AI
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Генерация музыки с AI
                  </p>
                  {APP_CONFIG.beta.enabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-medium">
                      {APP_CONFIG.versionName} v{APP_CONFIG.version}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Equalizer animation */}
            {!shouldReduceMotion && variant !== 'minimal' && (
              <motion.div
                className="flex items-end justify-center gap-1 h-8"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: variant === 'splash' ? 0.5 : 0.2 }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <EqualizerBar 
                    key={i} 
                    delay={i * 0.08} 
                    maxHeight={10 + Math.sin(i * 0.6) * 8 + 6}
                    color={i % 3 === 0 ? 'generate' : 'primary'}
                  />
                ))}
              </motion.div>
            )}

            {/* Minimal variant uses spinning vinyl */}
            {variant === 'minimal' && !shouldReduceMotion && (
              <VinylDisc size="sm" />
            )}

            {/* Reduced motion fallback */}
            {shouldReduceMotion && (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            )}

            {/* Progress indicator */}
            {progress !== undefined && (
              <div className="w-48">
                <div 
                  className="h-1.5 bg-muted/50 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary via-primary to-generate rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-1.5">
                  {Math.round(progress)}%
                </p>
              </div>
            )}

            {/* Message */}
            {displayMessage && (
              <motion.p
                className="text-sm text-muted-foreground text-center max-w-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: variant === 'splash' ? 0.6 : 0.3 }}
              >
                {displayMessage}
              </motion.p>
            )}
          </motion.div>

          {/* Bottom decorative progress line (splash only) */}
          {variant === 'splash' && !shouldReduceMotion && (
            <motion.div
              className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-0.5 rounded-full overflow-hidden bg-border/50"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-transparent via-primary to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Legacy exports for backwards compatibility
export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => (
  <UnifiedSplashScreen variant="splash" onComplete={onComplete} />
);

export const LoadingScreen = ({ 
  message, 
  progress,
  variant = 'loading',
  className 
}: { 
  message?: string; 
  progress?: number;
  variant?: 'loading' | 'inline' | 'overlay';
  className?: string;
}) => {
  const [showRetry, setShowRetry] = useState(false);
  
  useEffect(() => {
    // Show retry button after 8 seconds
    const timer = setTimeout(() => setShowRetry(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (showRetry) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50 gap-4">
        <p className="text-muted-foreground">Загрузка занимает слишком долго</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Перезагрузить
        </button>
      </div>
    );
  }

  return (
    <UnifiedSplashScreen 
      variant={variant === 'loading' ? 'loading' : variant === 'inline' ? 'inline' : 'overlay'} 
      message={message} 
      progress={progress}
      className={className}
    />
  );
};

export default UnifiedSplashScreen;
