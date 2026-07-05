/**
 * Unit tests for useReducedMotion utilities
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { getStaggerStyle, safeAnimationClasses, instantTransition, reducedMotionVariants } from "@/hooks/useReducedMotion";

describe("getStaggerStyle", () => {
  it("returns empty object when reduced motion is preferred", () => {
    expect(getStaggerStyle(0, true)).toEqual({});
    expect(getStaggerStyle(5, true)).toEqual({});
  });

  it("returns animation delay based on index", () => {
    expect(getStaggerStyle(0, false)).toEqual({ animationDelay: "0ms" });
    expect(getStaggerStyle(1, false)).toEqual({ animationDelay: "50ms" });
    expect(getStaggerStyle(3, false)).toEqual({ animationDelay: "150ms" });
  });

  it("uses custom base delay", () => {
    expect(getStaggerStyle(2, false, 100)).toEqual({ animationDelay: "200ms" });
  });

  it("defaults to reduced motion false", () => {
    expect(getStaggerStyle(1)).toEqual({ animationDelay: "50ms" });
  });
});

describe("safeAnimationClasses", () => {
  it("contains motion-reduce classes for all animations", () => {
    expect(safeAnimationClasses.fadeIn).toContain("motion-reduce:animate-none");
    expect(safeAnimationClasses.fadeOut).toContain("motion-reduce:animate-none");
    expect(safeAnimationClasses.slideUp).toContain("motion-reduce:animate-none");
    expect(safeAnimationClasses.spin).toContain("motion-reduce:animate-none");
  });

  it("has proper animation class names", () => {
    expect(safeAnimationClasses.fadeIn).toContain("animate-fade-in");
    expect(safeAnimationClasses.slideUp).toContain("animate-slide-up");
    expect(safeAnimationClasses.scaleIn).toContain("animate-scale-in");
  });
});

describe("instantTransition", () => {
  it("has zero duration", () => {
    expect(instantTransition).toEqual({ duration: 0 });
  });
});

describe("reducedMotionVariants", () => {
  it("has initial, animate, and exit states", () => {
    expect(reducedMotionVariants.initial).toEqual({ opacity: 0 });
    expect(reducedMotionVariants.animate).toBeDefined();
    expect(reducedMotionVariants.exit).toBeDefined();
  });

  it("uses instant transition for animate and exit", () => {
    const animate = reducedMotionVariants.animate as { opacity: number; transition: { duration: number } };
    const exit = reducedMotionVariants.exit as { opacity: number; transition: { duration: number } };
    expect(animate.transition.duration).toBe(0);
    expect(exit.transition.duration).toBe(0);
  });
});
