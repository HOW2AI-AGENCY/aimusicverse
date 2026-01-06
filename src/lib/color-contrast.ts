/**
 * Color Contrast Utility
 * Feature: 032-professional-ui
 *
 * Validates color combinations against WCAG AA standards.
 * Provides utilities for checking and ensuring accessible color contrast.
 */

import { colors } from './design-tokens';

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

/**
 * Calculate relative luminance of a color
 */
export const getLuminance = (hex: string): number => {
  const { r, g, b } = hexToRgb(hex);

  const [r2, g2, b2] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (foreground: string, background: string): number => {
  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if contrast meets WCAG AA standards
 */
export const meetsWcagAA = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const threshold = isLargeText ? 3 : 4.5;
  return ratio >= threshold;
};

/**
 * Check if contrast meets WCAG AAA standards
 */
export const meetsWcagAAA = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const threshold = isLargeText ? 4.5 : 7;
  return ratio >= threshold;
};

/**
 * Get WCAG compliance rating
 */
export const getWcagRating = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): 'AAA' | 'AA' | 'FAIL' => {
  if (meetsWcagAAA(foreground, background, isLargeText)) return 'AAA';
  if (meetsWcagAA(foreground, background, isLargeText)) return 'AA';
  return 'FAIL';
};

/**
 * Validate design system color combinations
 */
export const validateDesignSystemColors = () => {
  const lightBg = colors.background.light;
  const darkBg = colors.background.dark;

  const validations = [
    {
      name: 'Primary on Light',
      foreground: colors.primary.light,
      background: lightBg,
      rating: getWcagRating(colors.primary.light, lightBg),
      ratio: getContrastRatio(colors.primary.light, lightBg).toFixed(2),
    },
    {
      name: 'Primary on Dark',
      foreground: colors.primary.dark,
      background: darkBg,
      rating: getWcagRating(colors.primary.dark, darkBg),
      ratio: getContrastRatio(colors.primary.dark, darkBg).toFixed(2),
    },
    {
      name: 'Text Primary on Light',
      foreground: colors.text.primary.light,
      background: lightBg,
      rating: getWcagRating(colors.text.primary.light, lightBg),
      ratio: getContrastRatio(colors.text.primary.light, lightBg).toFixed(2),
    },
    {
      name: 'Text Primary on Dark',
      foreground: colors.text.primary.dark,
      background: darkBg,
      rating: getWcagRating(colors.text.primary.dark, darkBg),
      ratio: getContrastRatio(colors.text.primary.dark, darkBg).toFixed(2),
    },
    {
      name: 'Text Secondary on Light',
      foreground: colors.text.secondary.light,
      background: lightBg,
      rating: getWcagRating(colors.text.secondary.light, lightBg, true),
      ratio: getContrastRatio(colors.text.secondary.light, lightBg).toFixed(2),
    },
    {
      name: 'Text Secondary on Dark',
      foreground: colors.text.secondary.dark,
      background: darkBg,
      rating: getWcagRating(colors.text.secondary.dark, darkBg, true),
      ratio: getContrastRatio(colors.text.secondary.dark, darkBg).toFixed(2),
    },
  ];

  return validations;
};

/**
 * Get appropriate text color for background
 * Automatically selects light or dark text based on contrast
 */
export const getAccessibleTextColor = (backgroundColor: string): string => {
  const bgLuminance = getLuminance(backgroundColor);
  const lightText = colors.text.primary.light;
  const darkText = colors.text.primary.dark;

  const lightContrast = getContrastRatio(lightText, backgroundColor);
  const darkContrast = getContrastRatio(darkText, backgroundColor);

  return darkContrast > lightContrast ? darkText : lightText;
};

/**
 * Adjust color to meet contrast threshold
 * Lightens or darkens the foreground color until it meets WCAG AA
 */
export const adjustColorForContrast = (
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string => {
  let adjusted = foreground;
  let iterations = 0;
  const maxIterations = 100;

  while (getContrastRatio(adjusted, background) < targetRatio && iterations < maxIterations) {
    const fgLuminance = getLuminance(adjusted);
    const bgLuminance = getLuminance(background);

    if (fgLuminance > bgLuminance) {
      // Darken foreground
      adjusted = darkenColor(adjusted, 0.05);
    } else {
      // Lighten foreground
      adjusted = lightenColor(adjusted, 0.05);
    }
    iterations++;
  }

  return adjusted;
};

/**
 * Darken a hex color by a percentage
 */
export const darkenColor = (hex: string, percent: number): string => {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 - percent;

  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n * factor))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Lighten a hex color by a percentage
 */
export const lightenColor = (hex: string, percent: number): string => {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent;

  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n * factor))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export default {
  hexToRgb,
  getLuminance,
  getContrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  getWcagRating,
  validateDesignSystemColors,
  getAccessibleTextColor,
  adjustColorForContrast,
  darkenColor,
  lightenColor,
};
