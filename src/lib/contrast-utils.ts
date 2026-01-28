/**
 * Contrast Utilities
 * Feature: 032-professional-ui
 * 
 * Runtime utilities for checking and ensuring WCAG AA contrast compliance.
 * Use sparingly - prefer semantic tokens which are pre-verified.
 */

/**
 * Parse HSL string to components
 * Supports formats: "207 90% 54%" or "hsl(207, 90%, 54%)"
 */
export function parseHSL(hslString: string): { h: number; s: number; l: number } | null {
  const match = hslString.match(/(\d+(?:\.\d+)?)\s*,?\s*(\d+(?:\.\d+)?)%?\s*,?\s*(\d+(?:\.\d+)?)%?/);
  if (!match) return null;
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Calculate relative luminance per WCAG 2.1
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio between 1 and 21
 */
export function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getRelativeLuminance(color1.r, color1.g, color1.b);
  const l2 = getRelativeLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA requirements
 * - Normal text: 4.5:1
 * - Large text (18pt+ or 14pt+ bold): 3:1
 */
export function meetsContrastAA(ratio: number, isLargeText = false): boolean {
  return ratio >= (isLargeText ? 3 : 4.5);
}

/**
 * Check if contrast meets WCAG AAA requirements
 * - Normal text: 7:1
 * - Large text: 4.5:1
 */
export function meetsContrastAAA(ratio: number, isLargeText = false): boolean {
  return ratio >= (isLargeText ? 4.5 : 7);
}

/**
 * Get accessible foreground color for a background
 * Returns 'light' or 'dark' recommendation
 */
export function getAccessibleForeground(bgHsl: string): 'light' | 'dark' {
  const parsed = parseHSL(bgHsl);
  if (!parsed) return 'dark';
  
  const rgb = hslToRgb(parsed.h, parsed.s, parsed.l);
  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  
  // If background is dark (luminance < 0.5), use light text
  return luminance < 0.5 ? 'light' : 'dark';
}

/**
 * Semantic color classes with guaranteed contrast
 * Use these instead of raw color values
 */
export const contrastSafeColors = {
  // Primary actions - verified 4.5:1+ on both light/dark backgrounds
  primary: {
    bg: 'bg-primary',
    text: 'text-primary-foreground',
    combined: 'bg-primary text-primary-foreground',
  },
  
  // Secondary/muted content
  muted: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    combined: 'bg-muted text-muted-foreground',
  },
  
  // Destructive/error states
  destructive: {
    bg: 'bg-destructive',
    text: 'text-destructive-foreground',
    combined: 'bg-destructive text-destructive-foreground',
  },
  
  // Success states
  success: {
    bg: 'bg-success-subtle',
    text: 'color-success',
    combined: 'bg-success-subtle color-success',
  },
  
  // Warning states
  warning: {
    bg: 'bg-warning-subtle',
    text: 'color-warning',
    combined: 'bg-warning-subtle color-warning',
  },
} as const;

export default {
  parseHSL,
  hslToRgb,
  getRelativeLuminance,
  getContrastRatio,
  meetsContrastAA,
  meetsContrastAAA,
  getAccessibleForeground,
  contrastSafeColors,
};
