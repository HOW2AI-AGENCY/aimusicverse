/**
 * Z-Index Constants
 * Sprint 038-A: Foundation
 *
 * Single source of truth for all z-index values.
 * Replaces magic numbers (z-50, z-[999], etc.) with named constants.
 *
 * Based on docs/Z_INDEX_HIERARCHY.md
 */
export const Z_BASE = 0;
export const Z_DROPDOWN = 100;
export const Z_STICKY = 200;
export const Z_DRAWER = 300;
export const Z_MODAL = 400;
export const Z_POPOVER = 500;
export const Z_TOAST = 600;
export const Z_DEV_OVERLAY = 99999;

/** Tailwind z-index class map — use these in className */
export const Z_CLASS = {
  base: "z-0",
  dropdown: "z-[100]",
  sticky: "z-[200]",
  drawer: "z-[300]",
  modal: "z-[400]",
  popover: "z-[500]",
  toast: "z-[600]",
} as const;