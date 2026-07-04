/**
 * Design Spacing System - Minimalist Approach
 *
 * Generous whitespace creates visual clarity and luxury feel.
 * This system provides consistent spacing scales for all UI elements.
 *
 * SPACING PHILOSOPHY:
 * - More whitespace = clearer visual hierarchy
 * - Consistent rhythm = predictable, polished feel
 * - Large gaps = grouping and separation
 *
 * USAGE:
 * Import and use in className for consistency
 * Example: className="px-section-mobile lg:px-section-desktop"
 */

import { cn } from "@/lib/utils";

// ===== SPACING SCALE =====
// Base unit: 8px. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 80, 96

export const spacing = {
  // Micro spacing (elements within components)
  micro: "4px", // 0.25rem - tight spacing
  tiny: "8px", // 0.5rem  - icon padding, tight gaps
  compact: "12px", // 0.75rem - small gaps
  base: "16px", // 1rem    - standard padding

  // Comfortable spacing (component internal)
  comfortable: "20px", // 1.25rem - card padding
  relaxed: "24px", // 1.5rem  - comfortable padding
  spacious: "32px", // 2rem    - generous padding

  // Section spacing (between major sections)
  sectionCompact: "40px", // 2.5rem - tight section breaks
  section: "48px", // 3rem   - standard section spacing
  sectionSpacious: "64px", // 4rem   - generous section spacing
  sectionLuxury: "80px", // 5rem   - luxury spacing for hero sections
  sectionGrand: "96px", // 6rem   - maximum spacing for major breaks
} as const;

// ===== TAILWIND CLASSES =====
// Pre-configured Tailwind classes for common spacing patterns

export const spacingClasses = {
  // Container padding (mobile-first)
  containerMobile: "px-5", // 20px - comfortable mobile padding
  containerTablet: "sm:px-6", // 24px - tablet padding
  containerDesktop: "lg:px-8", // 32px - desktop padding

  // Section spacing (vertical rhythm)
  sectionMobile: "py-12", // 48px - mobile section spacing
  sectionTablet: "sm:py-16", // 64px - tablet section spacing
  sectionDesktop: "lg:py-20", // 80px - desktop section spacing

  // Gap between sections (white space)
  gapSectionMobile: "gap-12", // 48px - mobile section gap
  gapSectionTablet: "sm:gap-16", // 64px - tablet section gap
  gapSectionDesktop: "lg:gap-20", // 80px - desktop section gap

  // Grid gaps (between cards/items)
  gridGapMobile: "gap-4", // 16px - mobile grid gap
  gridGapTablet: "sm:gap-5", // 20px - tablet grid gap
  gridGapDesktop: "lg:gap-6", // 24px - desktop grid gap

  // Content spacing (within components)
  contentCompact: "space-y-4", // 16px - tight content spacing
  contentBase: "space-y-6", // 24px - standard content spacing
  contentSpacious: "space-y-8", // 32px - generous content spacing

  // Card padding
  cardMobile: "p-4", // 16px - compact card padding
  cardTablet: "sm:p-5", // 20px - comfortable card padding
  cardDesktop: "lg:p-6", // 24px - spacious card padding
} as const;

// ===== RESPONSIVE SPACING HELPERS =====
// Functions to generate responsive spacing classes

/**
 * Get responsive section gap classes
 * @returns Tailwind classes for vertical section spacing
 */
export function sectionGap() {
  return cn("gap-10 sm:gap-14 lg:gap-16 xl:gap-20");
}

/**
 * Get responsive container padding
 * @returns Tailwind classes for horizontal padding
 */
export function containerPadding() {
  return cn("px-5 sm:px-6 lg:px-8 xl:px-10");
}

/**
 * Get responsive grid gap
 * @returns Tailwind classes for grid/item spacing
 */
export function gridGap() {
  return cn("gap-4 sm:gap-5 lg:gap-6 xl:gap-8");
}

/**
 * Get responsive content spacing
 * @returns Tailwind classes for vertical content rhythm
 */
export function contentSpacing() {
  return cn("space-y-6 sm:space-y-8 lg:space-y-10");
}

// ===== SPECIALIZED SPACING PATTERNS =====

/**
 * Hero section spacing - extra generous for visual impact
 */
export function heroSpacing() {
  return cn("py-16 sm:py-20 lg:py-24 xl:py-32");
}

/**
 * Card section spacing - comfortable but not excessive
 */
export function cardSectionSpacing() {
  return cn("space-y-6 sm:space-y-8 lg:space-y-10");
}

/**
 * List item spacing - clear separation between items
 */
export function listItemSpacing() {
  return cn("space-y-3 sm:space-y-4 lg:space-y-5");
}

// ===== TYPE DEFINITIONS =====

export type SpacingKey = keyof typeof spacing;
export type SpacingClassKey = keyof typeof spacingClasses;

// ===== CSS CUSTOM PROPERTIES =====
// For use in inline styles or CSS-in-JS

export const spacingVars = {
  "--spacing-micro": spacing.micro,
  "--spacing-tiny": spacing.tiny,
  "--spacing-compact": spacing.compact,
  "--spacing-base": spacing.base,
  "--spacing-comfortable": spacing.comfortable,
  "--spacing-relaxed": spacing.relaxed,
  "--spacing-spacious": spacing.spacious,
  "--spacing-section": spacing.section,
  "--spacing-section-spacious": spacing.sectionSpacious,
  "--spacing-section-luxury": spacing.sectionLuxury,
} as const;
