/**
 * UnifiedSplashScreen - Optimized splash/loading screen
 * GPU-accelerated CSS animations for fast first paint
 */
import { useEffect, useState, memo } from "react";
import { AnimatePresence, useReducedMotion } from '@/lib/motion';
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { APP_CONFIG } from '@/config/app.config';
import { getSafeAreaBottom } from '@/constants/safe-area';
import { FixedOverlay } from '@/components/layout/FixedOverlay';

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

// CSS-based equalizer for GPU acceleration (no JS animation overhead)
const CSSEqualizer = memo(() => (
  <div className="flex items-end justify-center gap-1 h-8" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="w-1 rounded-full bg-gradient-to-t from-primary to-primary/50 will-change-transform"
        style={{
          animation: `equalizer 0.6s ease-in-out infinite`,
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
));
CSSEqualizer.displayName = 'CSSEqualizer';

export function UnifiedSplashScreen({
  variant = 'splash',
  message,
  progress,
  showLogo = true,
  onComplete,
  duration = 1000, // Reduced from 1200ms for snappier feel
  className,
}: UnifiedSplashScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);

  // Auto-complete for splash variant - faster transition
  useEffect(() => {
    if (variant === 'splash' && onComplete) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 150); // Reduced exit delay
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [variant, onComplete, duration]);

  // Container styles - optimized with will-change for GPU compositing
  const containerClasses: Record<SplashVariant, string> = {
    splash: 'fixed left-0 right-0 top-0 h-[var(--tg-viewport-stable-height,100vh)] flex flex-col items-center justify-center bg-background z-system will-change-opacity',
    loading: 'fixed left-0 right-0 top-0 h-[var(--tg-viewport-stable-height,100vh)] flex flex-col items-center justify-center bg-background z-fullscreen will-change-opacity',
    overlay: 'fixed left-0 right-0 top-0 h-[var(--tg-viewport-stable-height,100vh)] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-fullscreen will-change-opacity',
    inline: 'flex items-center justify-center py-12',
    minimal: 'flex items-center justify-center p-4',
  };

  // Safe area with fallback for first paint
  const safeAreaStyle = (variant === 'splash' || variant === 'loading' || variant === 'overlay') ? {
    paddingTop: `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 44px), env(safe-area-inset-top, 44px)) + 12px)`,
    paddingBottom: getSafeAreaBottom(0),
  } : {};

  const defaultMessage = {
    splash: '',
    loading: 'Загрузка...',
    overlay: 'Подождите...',
    inline: 'Загрузка...',
    minimal: '',
  };

  const displayMessage = message ?? defaultMessage[variant];

  // Use CSS transitions instead of framer-motion for faster paint
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        containerClasses[variant],
        'animate-fade-in',
        className
      )}
      style={safeAreaStyle}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Simplified background - single CSS gradient, no JS animation */}
      {(variant === 'splash' || variant === 'loading') && !shouldReduceMotion && (
        <div 
          className="absolute inset-0 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div 
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full blur-3xl opacity-20"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Main content - no JS animation, pure CSS */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Logo - static with CSS glow */}
        {showLogo && (variant === 'splash' || variant === 'loading') && (
          <div className="relative mb-2">
            {/* Simple CSS glow */}
            {!shouldReduceMotion && (
              <div 
                className="absolute -inset-4 rounded-3xl bg-primary/25 blur-xl"
                style={{ animation: 'pulse 2s ease-in-out infinite' }}
              />
            )}
            
            {/* Logo container */}
            <div className="relative p-3 rounded-3xl bg-card/80 backdrop-blur-sm border border-primary/20 shadow-xl">
              <img 
                src={logo} 
                alt="MusicVerse AI" 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl" 
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        )}

        {/* App name for splash variant */}
        {variant === 'splash' && (
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-1">
              MusicVerse AI
            </h1>
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-muted-foreground">
                Генерация музыки с AI
              </p>
              {APP_CONFIG.beta.enabled && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-medium">
                  {APP_CONFIG.versionName}
                </span>
              )}
            </div>
          </div>
        )}

        {/* CSS Equalizer - GPU accelerated */}
        {!shouldReduceMotion && variant !== 'minimal' && <CSSEqualizer />}

        {/* Minimal variant - simple spinner */}
        {variant === 'minimal' && (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}

        {/* Reduced motion fallback */}
        {shouldReduceMotion && (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        )}

        {/* Progress indicator - CSS transition */}
        {progress !== undefined && (
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
        )}

        {/* Message */}
        {displayMessage && (
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {displayMessage}
          </p>
        )}
      </div>

      {/* Bottom progress line - pure CSS */}
      {variant === 'splash' && !shouldReduceMotion && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-24 h-0.5 rounded-full overflow-hidden bg-border/30">
          <div 
            className="h-full w-1/2 bg-primary/60 rounded-full"
            style={{
              animation: 'shimmer 1s linear infinite',
            }}
          />
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

/**
 * Simplified splash screen for initial app load
 * Used in Auth.tsx for first-time load animation
 */
export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => (
  <UnifiedSplashScreen variant="splash" onComplete={onComplete} />
);

export const LoadingScreen = memo(({ 
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
  const [loadingTime, setLoadingTime] = useState(0);
  const [showRetry, setShowRetry] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    // Faster progress updates for perceived speed
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 0.3);
    }, 300);
    
    // Show retry after 12 seconds
    const retryTimer = setTimeout(() => setShowRetry(true), 12000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(retryTimer);
    };
  }, []);

  // Faster simulated progress curve
  const simulatedProgress = progress ?? Math.min(loadingTime * 20, 95);

  if (dismissed) {
    return (
      <FixedOverlay
        center
        background="blur"
        zIndex="fullscreen"
        style={{ minHeight: 'var(--tg-viewport-stable-height, 100vh)' }}
      >
        <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
      </FixedOverlay>
    );
  }

  if (showRetry) {
    return (
      <FixedOverlay
        center
        background="solid"
        zIndex="fullscreen"
        className="px-6"
        style={{ minHeight: 'var(--tg-viewport-stable-height, 100vh)' }}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <p className="text-muted-foreground text-center">Загрузка занимает дольше обычного</p>
          <div className="flex gap-2">
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2.5 bg-muted text-muted-foreground rounded-lg active:scale-95 transition-transform min-h-[44px]"
            >
              Подождать
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg active:scale-95 transition-transform min-h-[44px]"
            >
              Обновить
            </button>
          </div>
        </div>
      </FixedOverlay>
    );
  }

  return (
    <UnifiedSplashScreen 
      variant={variant === 'loading' ? 'loading' : variant === 'inline' ? 'inline' : 'overlay'} 
      message={message ?? (loadingTime > 3 ? 'Почти готово...' : undefined)}
      progress={simulatedProgress}
      className={className}
    />
  );
});
LoadingScreen.displayName = 'LoadingScreen';

export default UnifiedSplashScreen;
