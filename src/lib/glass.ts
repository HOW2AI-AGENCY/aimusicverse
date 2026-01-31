/**
 * Glassmorphism utilities and presets
 * Phase 5 Professional UI (Spec 032)
 * 
 * Provides consistent glassmorphism effects across the application.
 */

import { cn } from '@/lib/utils';

/**
 * Glassmorphism preset classes
 */
export const glass = {
  // Light glass - subtle frosted effect
  light: cn(
    'bg-white/60 dark:bg-black/40',
    'backdrop-blur-md',
    'border border-white/20 dark:border-white/10'
  ),
  
  // Medium glass - standard frosted glass
  medium: cn(
    'bg-white/70 dark:bg-black/50',
    'backdrop-blur-lg',
    'border border-white/30 dark:border-white/15'
  ),
  
  // Heavy glass - strong frosted effect
  heavy: cn(
    'bg-white/80 dark:bg-black/60',
    'backdrop-blur-xl',
    'border border-white/40 dark:border-white/20'
  ),
  
  // Card glass - optimized for cards
  card: cn(
    'bg-card/80 backdrop-blur-xl',
    'border border-border/50',
    'shadow-lg shadow-black/5'
  ),
  
  // Navigation glass - sticky headers/navs
  nav: cn(
    'bg-background/90 backdrop-blur-xl',
    'border-b border-border/50',
    'shadow-sm'
  ),
  
  // Overlay glass - modals/dialogs
  overlay: cn(
    'bg-background/95 backdrop-blur-2xl',
    'border border-border/30',
    'shadow-2xl'
  ),
  
  // Player glass - for audio player
  player: cn(
    'bg-card/95 backdrop-blur-xl',
    'border border-border/50 rounded-2xl',
    'shadow-lg shadow-black/10'
  ),
  
  // Pill glass - for badges/pills
  pill: cn(
    'bg-black/40 dark:bg-white/10',
    'backdrop-blur-sm',
    'border-0'
  ),
};

/**
 * Glass surface variants for different purposes
 */
export const glassSurface = {
  elevated: cn(glass.card, 'hover:shadow-xl transition-shadow duration-300'),
  interactive: cn(glass.card, 'hover:bg-card/90 active:scale-[0.98] transition-all duration-200'),
  floating: cn(glass.overlay, 'animate-in fade-in-0 zoom-in-95'),
};

/**
 * Glass button variants
 */
export const glassButton = {
  default: cn(
    'bg-white/20 dark:bg-white/10',
    'backdrop-blur-sm',
    'border border-white/30 dark:border-white/20',
    'hover:bg-white/30 dark:hover:bg-white/20',
    'active:scale-95',
    'transition-all duration-150'
  ),
  primary: cn(
    'bg-primary/80 backdrop-blur-sm',
    'border border-primary/50',
    'text-primary-foreground',
    'hover:bg-primary/90',
    'active:scale-95',
    'transition-all duration-150'
  ),
  ghost: cn(
    'bg-transparent',
    'backdrop-blur-none',
    'border border-transparent',
    'hover:bg-white/10 dark:hover:bg-white/5',
    'active:scale-95',
    'transition-all duration-150'
  ),
};

/**
 * Gradient glass for special surfaces
 */
export const gradientGlass = {
  primary: cn(
    'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent',
    'backdrop-blur-lg',
    'border border-primary/20'
  ),
  accent: cn(
    'bg-gradient-to-br from-accent/20 via-accent/10 to-transparent',
    'backdrop-blur-lg',
    'border border-accent/20'
  ),
  rainbow: cn(
    'bg-gradient-to-r from-primary/20 via-generate/20 to-accent/20',
    'backdrop-blur-lg',
    'border border-white/20'
  ),
};

/**
 * Apply glass effect with custom configuration
 */
export function createGlass(config: {
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  opacity?: number;
  border?: boolean;
  shadow?: boolean;
}) {
  const { blur = 'lg', opacity = 0.7, border = true, shadow = true } = config;
  
  return cn(
    `bg-card/${Math.round(opacity * 100)}`,
    `backdrop-blur-${blur}`,
    border && 'border border-border/50',
    shadow && 'shadow-lg shadow-black/5'
  );
}

export default glass;
