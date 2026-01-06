/**
 * Design Tokens for Professional & Stylish UI Enhancement
 * Feature: 032-professional-ui
 * 
 * Centralized design system constants for typography, colors, spacing,
 * shadows, and animations. All tokens are technology-agnostic and
 * can be used across components.
 */

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const typography = {
  // Font sizes (in pixels, converted to rem)
  fontSize: {
    h1: '1.75rem',      // 28px - Page titles
    h2: '1.5rem',       // 24px - Section headers
    h3: '1.25rem',      // 20px - Card titles
    h4: '1.125rem',     // 18px - List titles
    bodyLarge: '1rem',  // 16px - Primary content
    body: '0.875rem',   // 14px - Standard text
    caption: '0.75rem', // 12px - Metadata
  },

  // Font weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line heights
  lineHeight: {
    tight: '1.2',      // Headings
    normal: '1.3',     // Subheadings
    comfortable: '1.5', // Body text
    relaxed: '1.6',    // Large body
  },
} as const;

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colors = {
  // Primary brand colors (Indigo/Violet for music/art aesthetic)
  primary: {
    light: '#6366f1',   // Indigo 500
    dark: '#818cf8',    // Indigo 400 (dark mode)
  },
  
  secondary: {
    light: '#8b5cf6',   // Violet 500
    dark: '#a78bfa',    // Violet 400 (dark mode)
  },

  // Semantic colors
  success: {
    light: '#10b981',   // Emerald 500
    dark: '#34d399',    // Emerald 400
  },
  
  warning: {
    light: '#f59e0b',   // Amber 500
    dark: '#fbbf24',    // Amber 400
  },
  
  error: {
    light: '#ef4444',   // Red 500
    dark: '#f87171',    // Red 400
  },

  // Neutral colors
  background: {
    light: '#ffffff',
    dark: '#111827',    // Gray 900
  },

  surface: {
    light: '#f9fafb',   // Gray 50
    dark: '#1f2937',    // Gray 800
  },

  text: {
    primary: {
      light: '#111827', // Gray 900
      dark: '#f9fafb',  // Gray 50
    },
    secondary: {
      light: '#6b7280', // Gray 500
      dark: '#d1d5db', // Gray 300
    },
  },
} as const;

// ============================================================================
// GRADIENT TOKENS
// ============================================================================

export const gradients = {
  primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  player: 'linear-gradient(180deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)',
  fab: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
} as const;

// ============================================================================
// SPACING TOKENS (4px base unit)
// ============================================================================

export const spacing = {
  xs: '4px',    // 0.25rem - Tight spacing
  sm: '8px',    // 0.5rem  - Compact
  md: '12px',   // 0.75rem - Comfortable
  lg: '16px',   // 1rem    - Standard
  xl: '24px',   // 1.5rem  - Relaxed
  '2xl': '32px', // 2rem    - Spacious
} as const;

// ============================================================================
// SHADOW/ELEVATION TOKENS
// ============================================================================

export const shadows = {
  none: 'none',
  level1: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  level2: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  level3: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  level4: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  level5: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// ============================================================================
// ANIMATION TIMING TOKENS
// ============================================================================

export const animation = {
  duration: {
    fast: 150,      // ms - Micro-interactions
    standard: 200,  // ms - Modals, sheets
    slow: 300,      // ms - Page transitions
  },

  easing: {
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'spring(15, 150)',
  },
} as const;

// ============================================================================
// ICON SIZE TOKENS
// ============================================================================

export const iconSizes = {
  small: '16px',
  standard: '20px',
  large: '24px',
} as const;

// ============================================================================
// TOUCH TARGET TOKENS
// ============================================================================

export const touchTargets = {
  minimum: '44px',
  recommended: '48px',
  spacing: '8px', // Between adjacent interactive elements
} as const;

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================

export const designTokens = {
  typography,
  colors,
  gradients,
  spacing,
  shadows,
  animation,
  iconSizes,
  touchTargets,
} as const;
