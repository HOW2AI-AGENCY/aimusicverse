/**
 * Z-Index System
 * Values are aligned with tailwind.config.ts — that file is the single source
 * of truth for z-index tokens.  Any change here MUST be mirrored there and in
 * src/lib/design-tokens.ts.
 *
 * HIERARCHY (from lowest to highest):
 *
 * 0.     Base content (default)
 * 10.    Raised content (cards, panels)
 * 20.    Sticky headers/footers
 * 30.    Floating elements
 * 40.    Overlays (backdrops)
 * 50.    Navigation (bottom nav, sidebar)
 * 60.    Player (compact, expanded)
 * 70.    Contextual hints
 * 80.    Dialogs, modals
 * 90.    Fullscreen player, studio
 * 100.   System notifications (achievements, alerts)
 * 150.   Sheet backdrops
 * 151.   Sheet content
 * 200.   Dropdown menus, popovers, select lists
 * 250.   Tooltips
 * 300.   Toasts, notifications
 * 9999.  Debug/development tools
 *
 * USAGE:
 * - Import and use these constants instead of hardcoded z-index values
 * - Never use arbitrary z-index values like z-[123]
 * - When adding new layers, update this file, tailwind.config.ts, and
 *   src/lib/design-tokens.ts
 */

/**
 * Consolidated z-index constants — mirrors tailwind.config.ts theme.extend.zIndex
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

  // Floating elements - small overlays
  floating: 30,

  // Overlays - backdrops for modals
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

  // Contextual UI - hints
  contextual: 70,
  hint: 70,

  // Dialogs - modals (same level as dialog in Tailwind config)
  dialog: 80,
  modal: 80,

  // Fullscreen - fullscreen player, studio, immersive views
  fullscreen: 90,
  fullscreenPlayer: 90,
  studio: 90,
  immersive: 90,

  // System notifications (achievements, alerts)
  system: 100,
  achievement: 100,
  levelUp: 100,
  alert: 100,
  systemNotification: 100,

  // Sheets - bottom sheets, side sheets (high-priority overlays)
  sheet: 150,
  sheetBackdrop: 150,
  sheetContent: 151,

  // Dropdowns/Popovers - floating menus (above sheets)
  dropdown: 200,
  popover: 200,
  selectDropdown: 200,
  contextMenu: 200,

  // Tooltips - above dropdowns
  tooltip: 250,

  // Toasts/Notifications - highest regular priority
  toast: 300,
  notification: 300,

  // Maximum - debug, critical UI
  max: 9999,
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
  "--z-base": Z_INDEX.base,
  "--z-raised": Z_INDEX.raised,
  "--z-sticky": Z_INDEX.sticky,
  "--z-floating": Z_INDEX.floating,
  "--z-overlay": Z_INDEX.overlay,
  "--z-navigation": Z_INDEX.navigation,
  "--z-player": Z_INDEX.player,
  "--z-contextual": Z_INDEX.contextual,
  "--z-dialog": Z_INDEX.dialog,
  "--z-fullscreen": Z_INDEX.fullscreen,
  "--z-system": Z_INDEX.system,
  "--z-sheet-backdrop": Z_INDEX.sheetBackdrop,
  "--z-sheet-content": Z_INDEX.sheetContent,
  "--z-dropdown": Z_INDEX.dropdown,
  "--z-popover": Z_INDEX.popover,
  "--z-tooltip": Z_INDEX.tooltip,
  "--z-toast": Z_INDEX.toast,
  "--z-notification": Z_INDEX.notification,
  "--z-max": Z_INDEX.max,
} as const;

/**
 * Tailwind utility classes for z-index
 * Usage: className="z-player" instead of className="z-60"
 */
export const zIndexUtilities = [
  "z-base",
  "z-raised",
  "z-sticky",
  "z-floating",
  "z-overlay",
  "z-navigation",
  "z-player",
  "z-contextual",
  "z-dialog",
  "z-fullscreen",
  "z-system",
  "z-sheet-backdrop",
  "z-sheet-content",
  "z-dropdown",
  "z-popover",
  "z-tooltip",
  "z-toast",
  "z-notification",
  "z-max",
] as const;

export type ZIndexKey = keyof typeof Z_INDEX;
