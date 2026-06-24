/**
 * Glassmorphism utilities and presets
 * Phase 5 Professional UI (Spec 032)
 * 
 * Provides consistent glassmorphism effects across the application.
 * WCAG AA compliant with proper contrast ratios.
 */

import { cn } from '@/lib/utils';

// ============================================================================
// BLUR INTENSITY SCALE
// ============================================================================

export const blur = {
  none: 'backdrop-blur-none',
  sm: 'backdrop-blur-sm',      // 4px
  md: 'backdrop-blur-md',      // 12px
  lg: 'backdrop-blur-lg',      // 16px
  xl: 'backdrop-blur-xl',      // 24px
  '2xl': 'backdrop-blur-2xl',  // 40px
  '3xl': 'backdrop-blur-3xl',  // 64px
} as const;

// ============================================================================
// GLASS PRESETS
// ============================================================================

/**
 * Glassmorphism preset classes
 * Use these instead of inline glass styles for consistency
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
  
  // Card glass - optimized for cards (RECOMMENDED)
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

  // Subtle glass - minimal effect
  subtle: cn(
    'bg-muted/30 backdrop-blur-sm',
    'border border-border/30'
  ),

  // Elevated glass - higher elevation
  elevated: cn(
    'bg-card/85 backdrop-blur-xl',
    'border border-border/40',
    'shadow-xl shadow-black/10'
  ),

  // Input glass - for form inputs
  input: cn(
    'bg-background/60 backdrop-blur-sm',
    'border border-border/50',
    'focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
  ),

  // Dropdown glass - for menus
  dropdown: cn(
    'bg-popover/95 backdrop-blur-xl',
    'border border-border/50',
    'shadow-xl shadow-black/15'
  ),
} as const;

export type GlassPreset = keyof typeof glass;

// ============================================================================
// GLASS SURFACE VARIANTS
// ============================================================================

/**
 * Glass surface variants for different purposes
 */
export const glassSurface = {
  elevated: cn(glass.card, 'hover:shadow-xl transition-shadow duration-300'),
  interactive: cn(glass.card, 'hover:bg-card/90 active:scale-[0.98] transition-all duration-200 cursor-pointer'),
  floating: cn(glass.overlay, 'animate-in fade-in-0 zoom-in-95'),
  selected: cn(glass.card, 'ring-2 ring-primary ring-offset-2 ring-offset-background'),
  hoverGlow: cn(glass.card, 'hover:ring-1 hover:ring-primary/20 transition-all duration-200'),
} as const;

// ============================================================================
// GLASS BUTTON VARIANTS
// ============================================================================

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
  subtle: cn(
    'bg-muted/50 backdrop-blur-sm',
    'border border-border/30',
    'hover:bg-muted/70',
    'active:scale-95',
    'transition-all duration-150'
  ),
} as const;

// ============================================================================
// GRADIENT GLASS
// ============================================================================

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
  success: cn(
    'bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent',
    'backdrop-blur-lg',
    'border border-emerald-500/20'
  ),
  warning: cn(
    'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent',
    'backdrop-blur-lg',
    'border border-amber-500/20'
  ),
  destructive: cn(
    'bg-gradient-to-br from-destructive/20 via-red-500/10 to-transparent',
    'backdrop-blur-lg',
    'border border-destructive/20'
  ),
  generate: cn(
    'bg-gradient-to-br from-generate/20 via-generate/10 to-transparent',
    'backdrop-blur-lg',
    'border border-generate/20'
  ),
  studio: cn(
    'bg-gradient-to-br from-studio/20 via-studio/10 to-transparent',
    'backdrop-blur-lg',
    'border border-studio/20'
  ),
} as const;

export type GradientGlassPreset = keyof typeof gradientGlass;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Apply glass effect with custom configuration
 */
export function createGlass(config: {
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  opacity?: number;
  border?: boolean;
  shadow?: boolean;
  dark?: boolean;
}): string {
  const { 
    blur: blurLevel = 'lg', 
    opacity = 0.7, 
    border = true, 
    shadow = true,
    dark = false,
  } = config;
  
  const opacityPercent = Math.round(opacity * 100);
  
  return cn(
    dark 
      ? `bg-black/${opacityPercent}` 
      : `bg-card/${opacityPercent}`,
    `backdrop-blur-${blurLevel}`,
    border && 'border border-border/50',
    shadow && 'shadow-lg shadow-black/5'
  );
}

/**
 * Get glass preset with additional modifiers
 */
export function getGlass(
  preset: GlassPreset,
  modifiers?: {
    interactive?: boolean;
    selected?: boolean;
    hoverGlow?: boolean;
    rounded?: 'md' | 'lg' | 'xl' | '2xl';
  }
): string {
  const base = glass[preset];
  const rounded = modifiers?.rounded ? `rounded-${modifiers.rounded}` : '';
  
  return cn(
    base,
    rounded,
    modifiers?.interactive && 'cursor-pointer hover:bg-card/90 active:scale-[0.98] transition-all duration-200',
    modifiers?.selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
    modifiers?.hoverGlow && 'hover:ring-1 hover:ring-primary/20'
  );
}

export default glass;
