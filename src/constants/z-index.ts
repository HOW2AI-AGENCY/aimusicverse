/**
 * Z-Index System
 * Single source of truth for all z-index values in the application
 *
 * HIERARCHY (from lowest to highest):
 *
 * 0.     Base content (default)
 * 10.    Raised content (cards, panels)
 * 20.    Sticky headers/footers
 * 30.    Floating elements (tooltips, popovers)
 * 40.    Overlays (backdrops)
 * 50.    Navigation (bottom nav, sidebar)
 * 60.    Player (compact, expanded)
 * 70.    Contextual hints, toasts
 * 80.    Dialogs, sheets, modals
 * 90.    Fullscreen player, studio
 * 100.   System notifications (achievements, alerts)
 * 200.   Dropdown menus, select lists
 * 9999.  Debug/development tools
 *
 * USAGE:
 * - Import and use these constants instead of hardcoded z-index values
 * - Never use arbitrary z-index values like z-[123]
 * - When adding new layers, update this file and the hierarchy above
 */

/**
 * Base layer - default content flow
 */
export const Z_INDEX = {
  // Base content
  base: 0,
  content: 0,

  // Raised content - cards, panels, elevated surfaces
  raised: 10,
  card: 10,
  panel: 10,

  // Sticky elements - headers, footers that scroll with content
  sticky: 20,
  stickyHeader: 20,
  stickyFooter: 20,

  // Floating elements - tooltips, popovers, small overlays
  floating: 30,
  tooltip: 30,
  popover: 30,

  // Overlays - backdrops for modals, sheets
  overlay: 40,
  backdrop: 40,

  // Navigation - bottom nav, sidebar, top navigation
  navigation: 50,
  bottomNav: 50,
  sidebar: 50,
  topNav: 50,

  // Player - compact and expanded player states
  player: 60,
  compactPlayer: 60,
  expandedPlayer: 60,
  playerOverlay: 61,

  // Contextual UI - hints, toasts, notifications
  contextual: 70,
  toast: 70,
  hint: 70,
  notification: 70,

  // Dialogs - modals, sheets, dialogs
  dialog: 80,
  modal: 80,
  sheet: 80,
  sheetBackdrop: 80,
  sheetContent: 81,

  // Fullscreen - fullscreen player, studio, immersive views
  fullscreen: 90,
  fullscreenPlayer: 90,
  studio: 90,
  immersive: 90,

  // System - achievement notifications, alerts, critical prompts
  system: 100,
  achievement: 100,
  levelUp: 100,
  alert: 100,
  systemNotification: 100,

  // Dropdowns - select dropdowns, menus (must be above everything)
  dropdown: 200,
  selectDropdown: 200,
  contextMenu: 200,

  // Debug - development tools (highest priority)
  debug: 9999,
} as const;

/**
 * Helper to get z-index value for a specific component type
 */
export function getZIndex(type: keyof typeof Z_INDEX): number {
  return Z_INDEX[type];
}

/**
 * CSS custom properties for z-index
 * Add these to :root in index.css if needed for dynamic values
 */
export const Z_INDEX_VARS = {
  '--z-base': Z_INDEX.base,
  '--z-raised': Z_INDEX.raised,
  '--z-sticky': Z_INDEX.sticky,
  '--z-floating': Z_INDEX.floating,
  '--z-overlay': Z_INDEX.overlay,
  '--z-navigation': Z_INDEX.navigation,
  '--z-player': Z_INDEX.player,
  '--z-contextual': Z_INDEX.contextual,
  '--z-dialog': Z_INDEX.dialog,
  '--z-fullscreen': Z_INDEX.fullscreen,
  '--z-system': Z_INDEX.system,
  '--z-dropdown': Z_INDEX.dropdown,
} as const;

/**
 * Tailwind utility classes for z-index
 * Usage: className="z-player" instead of className="z-60"
 */
export const zIndexUtilities = [
  'z-base',
  'z-raised',
  'z-sticky',
  'z-floating',
  'z-overlay',
  'z-navigation',
  'z-player',
  'z-contextual',
  'z-dialog',
  'z-fullscreen',
  'z-system',
  'z-dropdown',
] as const;

export type ZIndexKey = keyof typeof Z_INDEX;
