/**
 * Style Utilities
 * Feature: 032-professional-ui
 * 
 * TypeScript utilities for dynamic styling
 */

import { cn } from '@/lib/utils';

// ============================================================================
// TYPOGRAPHY UTILITIES
// ============================================================================

export const textStyles = {
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  h4: 'text-h4',
  body: 'text-body',
  bodySm: 'text-body-sm',
  caption: 'text-caption',
  tiny: 'text-tiny',
  label: 'text-label',
  mono: 'text-mono',
} as const;

export type TextStyle = keyof typeof textStyles;

/**
 * Get typography class with optional modifiers
 */
export function getTextStyle(
  style: TextStyle,
  options?: {
    gradient?: boolean;
    muted?: boolean;
    truncate?: 1 | 2 | 3;
  }
): string {
  const classes: string[] = [textStyles[style]];
  
  if (options?.gradient) {
    classes.push('text-gradient');
  }
  if (options?.muted) {
    classes.push('text-muted-foreground');
  }
  if (options?.truncate) {
    classes.push(`truncate-${options.truncate}`);
  }
  
  return cn(classes);
}

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

export const animationStyles = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  slideLeft: 'animate-slide-left',
  slideRight: 'animate-slide-right',
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  spin: 'animate-spin',
  pulse: 'animate-pulse-subtle',
  shimmer: 'animate-shimmer',
} as const;

export type AnimationStyle = keyof typeof animationStyles;

/**
 * Get animation class with reduced motion awareness
 */
export function getAnimation(
  style: AnimationStyle,
  options?: {
    delay?: number;
    stagger?: number;
  }
): string {
  const classes = [animationStyles[style], 'motion-reduce:animate-none'];
  
  if (options?.delay) {
    classes.push(`[animation-delay:${options.delay}ms]`);
  }
  if (options?.stagger !== undefined) {
    classes.push(`[animation-delay:${options.stagger * 50}ms]`);
  }
  
  return cn(classes);
}

// ============================================================================
// TOUCH TARGET UTILITIES
// ============================================================================

export const touchTargetStyles = {
  min: 'touch-target-44',
  comfortable: 'touch-target-48',
  large: 'touch-target-56',
  padded44: 'touch-target-padded-44',
  padded48: 'touch-target-padded-48',
  padded56: 'touch-target-padded-56',
  icon44: 'icon-button-44',
  icon48: 'icon-button-48',
  icon56: 'icon-button-56',
  listItem: 'list-item-touchable',
  listItemComfortable: 'list-item-touchable-comfortable',
  card: 'card-touchable',
  fab: 'fab',
  tab: 'tab-button',
} as const;

export type TouchTargetStyle = keyof typeof touchTargetStyles;

/**
 * Get touch target class with feedback
 */
export function getTouchTarget(
  style: TouchTargetStyle,
  options?: {
    feedback?: boolean;
  }
): string {
  const classes: string[] = [touchTargetStyles[style]];
  
  if (options?.feedback !== false) {
    classes.push('touch-target-feedback');
  }
  
  return cn(classes);
}

// ============================================================================
// FOCUS UTILITIES
// ============================================================================

export const focusStyles = {
  ring: 'focus-ring',
  ringInset: 'focus-ring focus-ring-inset',
  ringTight: 'focus-ring focus-ring-tight',
  ringLoose: 'focus-ring focus-ring-loose',
  subtle: 'focus-subtle',
  glow: 'focus-glow',
  keyboard: 'keyboard-focus',
  input: 'input-focus',
} as const;

export type FocusStyle = keyof typeof focusStyles;

// ============================================================================
// COLOR UTILITIES
// ============================================================================

export const colorStyles = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-[hsl(var(--success))]',
  warning: 'text-[hsl(var(--warning))]',
  error: 'text-destructive',
  muted: 'text-muted-foreground',
} as const;

export const bgColorStyles = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-[hsl(var(--success))]',
  warning: 'bg-[hsl(var(--warning))]',
  error: 'bg-destructive',
  muted: 'bg-muted',
  accent: 'bg-accent',
} as const;

// ============================================================================
// GRADIENT UTILITIES
// ============================================================================

export const gradientStyles = {
  primary: 'bg-gradient-primary',
  generate: 'bg-[image:var(--gradient-generate)]',
  success: 'bg-gradient-success',
  hero: 'bg-[image:var(--gradient-hero)]',
  card: 'bg-[image:var(--gradient-card)]',
} as const;

// ============================================================================
// SPACING UTILITIES
// ============================================================================

export const spacingStyles = {
  section: 'mb-4 sm:mb-6',
  sectionY: 'my-4 sm:my-6',
  card: 'p-3 sm:p-4',
  cardCompact: 'p-2.5 sm:p-3',
  cardLarge: 'p-4 sm:p-6',
  gap: 'gap-2 sm:gap-3',
  gapSm: 'gap-1.5 sm:gap-2',
  gapLg: 'gap-3 sm:gap-4',
  page: 'px-3 sm:px-4 md:px-6',
  pageY: 'py-3 sm:py-4',
} as const;

// ============================================================================
// CARD PATTERN UTILITIES
// ============================================================================

export const cardStyles = {
  base: 'rounded-lg border bg-card text-card-foreground shadow-elevation-1',
  interactive: 'rounded-lg border bg-card text-card-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:border-primary/50 transition-all duration-200 cursor-pointer active:scale-[0.99]',
  selected: 'rounded-lg border-2 border-primary bg-card text-card-foreground shadow-elevation-2',
  glass: 'glass-card rounded-xl border border-border/50 backdrop-blur-sm',
  enhanced: 'card-enhanced',
  elevated: 'rounded-xl border bg-card text-card-foreground shadow-elevation-3',
  floating: 'rounded-2xl border bg-card text-card-foreground shadow-elevation-4',
} as const;

export type CardStyle = keyof typeof cardStyles;

// ============================================================================
// ELEVATION UTILITIES (Design System Shadows)
// ============================================================================

export const elevationStyles = {
  0: 'shadow-elevation-0',
  1: 'shadow-elevation-1',
  2: 'shadow-elevation-2',
  3: 'shadow-elevation-3',
  4: 'shadow-elevation-4',
  5: 'shadow-elevation-5',
} as const;

export type ElevationLevel = keyof typeof elevationStyles;

/**
 * Get elevation shadow class
 */
export function getElevation(level: ElevationLevel): string {
  return elevationStyles[level];
}

// ============================================================================
// BORDER RADIUS UTILITIES (Consistent Corners)
// ============================================================================

export const radiusStyles = {
  none: 'rounded-none',
  sm: 'rounded-sm',      // 4px
  md: 'rounded-md',      // 6px
  lg: 'rounded-lg',      // 8px
  xl: 'rounded-xl',      // 12px
  '2xl': 'rounded-2xl',  // 16px
  '3xl': 'rounded-3xl',  // 24px
  full: 'rounded-full',
} as const;

export type RadiusStyle = keyof typeof radiusStyles;

// ============================================================================
// LOADING STATE UTILITIES
// ============================================================================

export const loadingStyles = {
  skeleton: 'skeleton',
  skeletonText: 'skeleton skeleton-text',
  skeletonCard: 'skeleton skeleton-card',
  skeletonAvatar: 'skeleton skeleton-avatar',
  skeletonPulse: 'skeleton-pulse',
  disabled: 'opacity-50 pointer-events-none',
  overlay: 'absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50',
} as const;

// ============================================================================
// INTERACTIVE STATE UTILITIES
// ============================================================================

export const interactiveStyles = {
  // Hover effects (only on devices that support hover)
  hoverLift: 'hover-lift',
  hoverScale: 'hover-scale',
  hoverGlow: 'hover-glow',
  hoverBg: 'hover-bg',
  hoverBorder: 'hover-border',
  
  // Press/Active effects
  pressScale: 'press-scale',
  pressOpacity: 'press-opacity',
  pressDepth: 'press-depth',
  
  // Combined effects
  interactive: 'interactive',
  interactiveCard: 'interactive-card',
  ripple: 'ripple',
  
  // State classes
  disabled: 'disabled-state',
  disabledMuted: 'disabled-muted',
  selected: 'selected-ring',
  selectedBorder: 'selected-border',
  selectedBg: 'selected-bg',
} as const;

export type InteractiveStyle = keyof typeof interactiveStyles;

/**
 * Get combined interactive styles for a clickable element
 */
export function getInteractiveClasses(
  options: {
    hover?: 'lift' | 'scale' | 'glow' | 'bg' | 'border';
    press?: 'scale' | 'opacity' | 'depth';
    selected?: boolean;
    disabled?: boolean;
  } = {}
): string {
  const classes: string[] = ['interactive'];
  
  if (options.hover) {
    const hoverMap = {
      lift: 'hover-lift',
      scale: 'hover-scale',
      glow: 'hover-glow',
      bg: 'hover-bg',
      border: 'hover-border',
    };
    classes.push(hoverMap[options.hover]);
  }
  
  if (options.press) {
    const pressMap = {
      scale: 'press-scale',
      opacity: 'press-opacity',
      depth: 'press-depth',
    };
    classes.push(pressMap[options.press]);
  }
  
  if (options.selected) {
    classes.push('selected-ring');
  }
  
  if (options.disabled) {
    classes.push('disabled-state');
  }
  
  return cn(classes);
}
