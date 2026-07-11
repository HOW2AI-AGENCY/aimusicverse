/**
 * Color Tokens Utility
 *
 * Provides type-safe color tokens for the application.
 * These tokens map to CSS custom properties defined in index.css.
 *
 * @feature Spec 001 - Phase 2: Foundational Components
 * @priority P1 - Design System Consistency
 */

// ============================================================================
// SECTION-SPECIFIC COLORS
// ============================================================================

export const sectionColors = {
  generate: "hsl(var(--generate))",
  generateGlow: "hsl(var(--generate-glow))",
  library: "hsl(var(--library))",
  libraryGlow: "hsl(var(--library-glow))",
  projects: "hsl(var(--projects))",
  projectsGlow: "hsl(var(--projects-glow))",
  community: "hsl(var(--community))",
  communityGlow: "hsl(var(--community-glow))",
  success: "hsl(var(--success))",
  successGlow: "hsl(var(--success-glow))",
  warning: "hsl(var(--warning))",
  warningGlow: "hsl(var(--warning-glow))",
} as const;

// ============================================================================
// SEMANTIC SURFACE & STATE COLORS
// ============================================================================

export const surfaceColors = {
  base: "hsl(var(--surface))",
  elevated: "hsl(var(--elevated))",
  floating: "hsl(var(--floating))",
  scrim: "hsl(var(--overlay-scrim))",
} as const;

export const stateColors = {
  success: "hsl(var(--state-success))",
  successForeground: "hsl(var(--state-success-foreground))",
  warning: "hsl(var(--state-warning))",
  warningForeground: "hsl(var(--state-warning-foreground))",
  danger: "hsl(var(--state-danger))",
  dangerForeground: "hsl(var(--state-danger-foreground))",
  info: "hsl(var(--state-info))",
  infoForeground: "hsl(var(--state-info-foreground))",
} as const;

// ============================================================================
// BASE UI COLORS
// ============================================================================

export const uiColors = {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: "hsl(var(--primary))",
  primaryForeground: "hsl(var(--primary-foreground))",
  secondary: "hsl(var(--secondary))",
  secondaryForeground: "hsl(var(--secondary-foreground))",
  destructive: "hsl(var(--destructive))",
  destructiveForeground: "hsl(var(--destructive-foreground))",
  muted: "hsl(var(--muted))",
  mutedForeground: "hsl(var(--muted-foreground))",
  accent: "hsl(var(--accent))",
  accentForeground: "hsl(var(--accent-foreground))",
} as const;

// ============================================================================
// GRADIENT TOKENS
// ============================================================================

export const gradients = {
  telegram: "linear-gradient(135deg, hsl(207 90% 54%), hsl(250 80% 60%))",
  primary: "var(--gradient-primary)",
  card: "var(--gradient-card)",
  hero: "var(--gradient-hero)",
  generate: "var(--gradient-generate)",
  success: "var(--gradient-success)",
} as const;

// ============================================================================
// COLOR TOKEN GETTERS
// ============================================================================

/**
 * Get a section color by name
 */
export function getSectionColor(section: keyof typeof sectionColors): string {
  return sectionColors[section];
}

/**
 * Get a surface color by level (1-3)
 */
export function getSurfaceColor(level: 1 | 2 | 3): string {
  return surfaceColors[`surface${level}` as const];
}

/**
 * Get a state color
 */
export function getStateColor(state: keyof typeof stateColors): string {
  return stateColors[state];
}

/**
 * Get a UI color
 */
export function getUIColor(color: keyof typeof uiColors): string {
  return uiColors[color];
}

/**
 * Check if a color is light or dark
 */
export function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

// ============================================================================
// COLOR PALETTE GENERATORS
// ============================================================================

/**
 * Generate a color palette with opacity variants
 */
export function generateColorPalette(baseColor: string) {
  return {
    50: `${baseColor}0d`, // 5% opacity
    100: `${baseColor}1a`, // 10% opacity
    200: `${baseColor}33`, // 20% opacity
    300: `${baseColor}4d`, // 30% opacity
    400: `${baseColor}66`, // 40% opacity
    500: `${baseColor}80`, // 50% opacity
    600: `${baseColor}99`, // 60% opacity
    700: `${baseColor}b3`, // 70% opacity
    800: `${baseColor}cc`, // 80% opacity
    900: `${baseColor}e6}`, // 90% opacity
  };
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const colorTokens = {
  section: sectionColors,
  surface: surfaceColors,
  state: stateColors,
  ui: uiColors,
  gradients,
} as const;

export type SectionColor = keyof typeof sectionColors;
export type SurfaceLevel = "base" | "elevated" | "floating";
export type StateColor = keyof typeof stateColors;
export type UIColor = keyof typeof uiColors;
