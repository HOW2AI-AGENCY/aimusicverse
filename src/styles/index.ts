/**
 * Styles Index
 * Feature: 032-professional-ui
 * 
 * Central import for all style modules
 * Import this file in App.tsx or main.tsx
 */

// Core design system styles
import './colors.css';
import './typography.css';
import './animations.css';
import './focus.css';
import './touch-targets.css';
import './interactions.css';
import './accessibility.css'; // NEW: WCAG AA compliance

// Re-export for programmatic access
export * from './style-utils';
