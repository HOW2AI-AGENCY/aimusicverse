/**
 * Color Contrast Tests
 * WCAG AA compliance tests for color contrast ratios
 *
 * Requirements:
 * - Normal text: 4.5:1 contrast ratio
 * - Large text (18px+ or 14px+ bold): 3:1 contrast ratio
 * - WCAG AAA (strict): 7:1 for normal, 4.5:1 for large
 */

import { describe, it, expect } from '@jest/globals';
import { contrastUtils } from '../lib/accessibility';

describe('Color Contrast WCAG AA', () => {
  describe('Primary Text on Background', () => {
    test('White text on black background meets 4.5:1', () => {
      const white = { r: 255, g: 255, b: 255 };
      const black = { r: 0, g: 0, b: 0 };

      const l1 = contrastUtils.getLuminance(...Object.values(white));
      const l2 = contrastUtils.getLuminance(...Object.values(black));
      const ratio = contrastUtils.getContrastRatio(l1, l2);

      expect(contrastUtils.meetsWCAG_AA(ratio)).toBe(true);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeCloseTo(21, 0);
    });

    test('Primary color on background meets 4.5:1', () => {
      // Assuming primary is a blue-ish color
      const primary = { r: 9, g: 105, b: 218 }; // #0969da
      const background = { r: 255, g: 255, b: 255 };

      const l1 = contrastUtils.getLuminance(...Object.values(primary));
      const l2 = contrastUtils.getLuminance(...Object.values(background));
      const ratio = contrastUtils.getContrastRatio(l1, l2);

      expect(contrastUtils.meetsWCAG_AA(ratio, false)).toBe(true);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Large Text', () => {
    test('White on black meets 3:1 for large text', () => {
      const white = { r: 255, g: 255, b: 255 };
      const black = { r: 0, g: 0, b: 0 };

      const l1 = contrastUtils.getLuminance(...Object.values(white));
      const l2 = contrastUtils.getLuminance(...Object.values(black));
      const ratio = contrastUtils.getContrastRatio(l1, l2);

      expect(contrastUtils.meetsWCAG_AA(ratio, true)).toBe(true);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Muted Foreground on Background', () => {
    test('Muted text meets 4.5:1', () => {
      // Common muted gray
      const muted = { r: 161, g: 161, b: 170 }; // #a1a1aa
      const background = { r: 255, g: 255, b: 255 };

      const l1 = contrastUtils.getLuminance(...Object.values(muted));
      const l2 = contrastUtils.getLuminance(...Object.values(background));
      const ratio = contrastUtils.getContrastRatio(l1, l2);

      expect(contrastUtils.meetsWCAG_AA(ratio, false)).toBe(true);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});

describe('Color Luminance Calculations', () => {
  test('Black has minimum luminance', () => {
    const black = contrastUtils.getLuminance(0, 0, 0);
    expect(black).toBe(0);
  });

  test('White has maximum luminance', () => {
    const white = contrastUtils.getLuminance(255, 255, 255);
    expect(white).toBe(1);
  });

  test('Gray has medium luminance', () => {
    const gray = contrastUtils.getLuminance(128, 128, 128);
    expect(gray).toBeCloseTo(0.215, 2);
  });
});

describe('Contrast Ratio Calculations', () => {
  test('Same colors have 1:1 ratio', () => {
    const color = { r: 128, g: 128, b: 128 };
    const l = contrastUtils.getLuminance(...Object.values(color));
    const ratio = contrastUtils.getContrastRatio(l, l);

    expect(ratio).toBe(1);
  });

  test('Black to white is 21:1', () => {
    const black = contrastUtils.getLuminance(0, 0, 0);
    const white = contrastUtils.getLuminance(255, 255, 255);
    const ratio = contrastUtils.getContrastRatio(black, white);

    expect(ratio).toBeCloseTo(21, 0);
  });
});

describe('WCAG AAA Compliance', () => {
  test('White on black meets AAA for normal text', () => {
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };

    const l1 = contrastUtils.getLuminance(...Object.values(white));
    const l2 = contrastUtils.getLuminance(...Object.values(black));
    const ratio = contrastUtils.getContrastRatio(l1, l2);

    expect(contrastUtils.meetsWCAG_AAA(ratio, false)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(7);
  });

  test('White on black meets AAA for large text', () => {
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };

    const l1 = contrastUtils.getLuminance(...Object.values(white));
    const l2 = contrastUtils.getLuminance(...Object.values(black));
    const ratio = contrastUtils.getContrastRatio(l1, l2);

    expect(contrastUtils.meetsWCAG_AAA(ratio, true)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
