/**
 * BrandedLoader - MusicVerse branded loading components
 * Features musical animations and brand-consistent styling
 */

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface BrandedLoaderProps {
  message?: string;
  variant?: 'fullscreen' | 'inline' | 'overlay' | 'minimal';
  showLogo?: boolean;
  className?: string;
}

// Musical note animation for bars
const BarAnimation = ({ delay = 0, height = 24 }: { delay?: number; height?: number }) => (
  <motion.div
    className="w-1 bg-gradient-to-t from-primary to-primary/60 rounded-full"
    initial={{ height: 8 }}
    animate={{ 
      height: [8, height, 8],
    }}
    transition={{
      duration: 0.8,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  />
);

// Equalizer-style loader
export function EqualizerLoader({ className, barCount = 5 }: { className?: string; barCount?: number }) {
  return (
    <div className={cn("flex items-end justify-center gap-1 h-8", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <BarAnimation 
          key={i} 
          delay={i * 0.15} 
          height={16 + Math.random() * 16}
        />
      ))}
    </div>
  );
}

// Pulsing music note
export function PulsingNote({ className }: { className?: string }) {
  return (
    <motion.div 
      className={cn("relative", className)}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
        animate={{ 
          boxShadow: [
            '0 0 0 0 hsl(207 90% 54% / 0.4)',
            '0 0 0 20px hsl(207 90% 54% / 0)',
          ]
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <svg 
          className="w-6 h-6 text-primary" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </motion.div>
    </motion.div>
  );
}

// Waveform animation
export function WaveformLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-primary/60 rounded-full"
          initial={{ height: 4 }}
          animate={{ 
            height: [4, 4 + Math.sin(i * 0.5) * 12 + Math.random() * 8, 4],
          }}
          transition={{
            duration: 0.6 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.05,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Spinning vinyl record
export function VinylLoader({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };

  return (
    <motion.div 
      className={cn("relative", sizeClasses[size], className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
      {/* Vinyl disc */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-lg">
        {/* Grooves */}
        <div className="absolute inset-[15%] rounded-full border border-zinc-700/50" />
        <div className="absolute inset-[25%] rounded-full border border-zinc-700/50" />
        <div className="absolute inset-[35%] rounded-full border border-zinc-700/50" />
        {/* Label */}
        <div className="absolute inset-[40%] rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-background" />
        </div>
      </div>
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}

// Dots loader with musical timing
export function MusicalDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full bg-primary"
          animate={{
            y: [-4, 4, -4],
            scale: [1, 0.8, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Main branded loader component
export function BrandedLoader({ 
  message = 'Загрузка...', 
  variant = 'fullscreen',
  showLogo = true,
  className 
}: BrandedLoaderProps) {
  const containerClasses = {
    fullscreen: 'fixed inset-0 flex items-center justify-center bg-background z-50',
    inline: 'flex items-center justify-center py-12',
    overlay: 'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md',
    minimal: 'flex items-center justify-center p-4',
  };

  return (
    <AnimatePresence>
      <motion.div 
        className={cn(containerClasses[variant], className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background effects for fullscreen */}
        {(variant === 'fullscreen' || variant === 'overlay') && (
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

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo with glow */}
          {showLogo && (
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
                  scale: [1, 1.03, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          )}

          {/* Equalizer animation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <EqualizerLoader barCount={7} />
          </motion.div>

          {/* Message */}
          {message && (
            <motion.p
              className="text-sm text-muted-foreground text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {message}
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Skeleton with shimmer animation
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

// Card skeleton with brand styling
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card p-4 space-y-3", className)}>
      <SkeletonShimmer className="h-32 w-full" />
      <SkeletonShimmer className="h-4 w-3/4" />
      <SkeletonShimmer className="h-3 w-1/2" />
    </div>
  );
}
