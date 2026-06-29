/**
 * Motion Animation Presets
 * Sprint 038-C: Animation Standards
 *
 * Duration and easing constants to eliminate magic numbers.
 * All framer-motion animations should use these instead of raw numbers.
 */
import type { Transition } from "@/lib/motion";

// ── Duration Tiers ─────────────────────────────────────────────────
export const DURATION_INSTANT = 0;
export const DURATION_FAST = 0.1; // 100ms — micro-interactions
export const DURATION_BASE = 0.2; // 200ms — default transitions
export const DURATION_SLOW = 0.3; // 300ms — emphasis
export const DURATION_SLOWER = 0.4;
export const DURATION_SLOWEST = 0.5;
export const DURATION_SPRING = 0.5; // spring-based, longer perceptual

// ── Easing Presets ─────────────────────────────────────────────────
export const EASE_DEFAULT: Transition = { duration: DURATION_BASE, ease: [0.4, 0, 0.2, 1] };
export const EASE_OUT: Transition = { duration: DURATION_BASE, ease: [0, 0, 0.2, 1] };
export const EASE_IN: Transition = { duration: DURATION_FAST, ease: [0.4, 0, 1, 1] };
export const EASE_BOUNCE: Transition = { duration: DURATION_SPRING, ease: [0.34, 1.56, 0.64, 1] };
export const EASE_SPRING: Transition = { type: "spring", stiffness: 500, damping: 30 };

// ── Preset Animations ──────────────────────────────────────────────
export const fadeIn = { opacity: 1, transition: EASE_DEFAULT };
export const fadeOut = { opacity: 0, transition: EASE_IN };
export const slideUp = { opacity: 1, y: 0, transition: EASE_DEFAULT };
export const slideDown = { opacity: 1, y: 0, transition: EASE_DEFAULT };
export const slideInFromRight = { opacity: 1, x: 0, transition: EASE_DEFAULT };
export const slideInFromLeft = { opacity: 1, x: 0, transition: EASE_DEFAULT };
export const scaleIn = { opacity: 1, scale: 1, transition: EASE_SPRING };
