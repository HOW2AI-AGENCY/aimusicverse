/**
 * Z-Index Utility
 *
 * Provides type-safe z-index values following a hierarchical system.
 * Prevents z-index conflicts and ensures consistent layering.
 *
 * Hierarchy (lowest to highest):
 * - base (0): Base content
 * - raised (10): Elevated content
 * - sticky (20): Sticky elements
 * - floating (30): Floating elements
 * - overlay (40): Overlay content
 * - navigation (50): Navigation bars
 * - player (60): Audio player
 * - contextual (70): Context menus
 * - dialog (80): Dialogs
 * - fullscreen (90): Fullscreen elements
 * - system (100): System-level overlays
 * - sheet-backdrop (150): Sheet backdrop
 * - sheet-content (151): Sheet content
 * - dropdown (200): Dropdown menus
 * - popover (200): Popovers
 * - tooltip (250): Tooltips
 * - toast (300): Toasts
 * - notification (300): Notifications
 * - max (9999): Maximum priority
 *
 * @feature Spec 001 - Phase 2: Foundational Components
 * @priority P1 - Design System Consistency
 */

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndexLayers = {
  base: 0,
  raised: 10,
  sticky: 20,
  floating: 30,
  overlay: 40,
  navigation: 50,
  player: 60,
  contextual: 70,
  dialog: 80,
  fullscreen: 90,
  system: 100,

  // High-priority overlays
  sheetBackdrop: 150,
  sheetContent: 151,
  dropdown: 200,
  popover: 200,
  tooltip: 250,
  toast: 300,
  notification: 300,

  // Maximum priority
  max: 9999,
} as const;

// ============================================================================
// Z-INDEX TOKEN GETTERS
// ============================================================================

/**
 * Get z-index value by layer name
 */
export function getZIndex(layer: keyof typeof zIndexLayers): number {
  return zIndexLayers[layer];
}

/**
 * Get z-index value as string for CSS
 */
export function getZIndexString(layer: keyof typeof zIndexLayers): string {
  return String(zIndexLayers[layer]);
}

// ============================================================================
// Z-INDEX VALIDATION
// ============================================================================

/**
 * Check if a z-index value is within the valid range
 */
export function isValidZIndex(zIndex: number): boolean {
  return zIndex >= 0 && zIndex <= 9999;
}

/**
 * Check if two z-index values would conflict
 */
export function wouldConflict(zIndex1: number, zIndex2: number): boolean {
  return zIndex1 === zIndex2 && zIndex1 !== zIndexLayers.base;
}

/**
 * Get the next available z-index above a given layer
 */
export function getNextZIndex(layer: keyof typeof zIndexLayers, offset = 10): number {
  const current = zIndexLayers[layer];
  const next = current + offset;
  return isValidZIndex(next) ? next : zIndexLayers.max;
}

// ============================================================================
// COMPONENT-SPECIFIC Z-INDEX HELPERS
// ============================================================================

/**
 * Get z-index for modal/backdrop combinations
 */
export function getModalZIndex(type: "backdrop" | "content"): number {
  return type === "backdrop" ? zIndexLayers.dialog : zIndexLayers.dialog + 1;
}

/**
 * Get z-index for sheet/backdrop combinations
 */
export function getSheetZIndex(type: "backdrop" | "content"): number {
  return type === "backdrop" ? zIndexLayers.sheetBackdrop : zIndexLayers.sheetContent;
}

/**
 * Get z-index for dropdown/popover combinations
 */
export function getDropdownZIndex(): number {
  return zIndexLayers.dropdown;
}

/**
 * Get z-index for tooltip/overlay combinations
 */
export function getTooltipZIndex(): number {
  return zIndexLayers.tooltip;
}

/**
 * Get z-index for toast/notification combinations
 */
export function getToastZIndex(): number {
  return zIndexLayers.toast;
}

// ============================================================================
// Z-INDEX COMPARISON UTILITIES
// ============================================================================

/**
 * Compare two z-index values
 * @returns -1 if zIndex1 < zIndex2, 0 if equal, 1 if zIndex1 > zIndex2
 */
export function compareZIndex(zIndex1: number, zIndex2: number): number {
  if (zIndex1 < zIndex2) return -1;
  if (zIndex1 > zIndex2) return 1;
  return 0;
}

/**
 * Check if zIndex1 is above zIndex2
 */
export function isAbove(zIndex1: number, zIndex2: number): boolean {
  return zIndex1 > zIndex2;
}

/**
 * Check if zIndex1 is below zIndex2
 */
export function isBelow(zIndex1: number, zIndex2: number): boolean {
  return zIndex1 < zIndex2;
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ZIndexLayer = keyof typeof zIndexLayers;

export const zIndexDescriptions = {
  base: "Base content layer",
  raised: "Elevated content",
  sticky: "Sticky positioned elements",
  floating: "Floating elements",
  overlay: "Overlay content",
  navigation: "Navigation bars and menus",
  player: "Audio player overlay",
  contextual: "Context menus and dropdowns",
  dialog: "Modal dialogs",
  fullscreen: "Fullscreen overlays",
  system: "System-level notifications",
  sheetBackdrop: "Sheet backdrop",
  sheetContent: "Sheet content",
  dropdown: "Dropdown menus",
  popover: "Popover content",
  tooltip: "Tooltip overlays",
  toast: "Toast notifications",
  notification: "System notifications",
  max: "Maximum priority (emergency use only)",
} as const;

// ============================================================================
// EXPORT ALL
// ============================================================================

export const zIndexTokens = {
  layers: zIndexLayers,
  descriptions: zIndexDescriptions,
} as const;
