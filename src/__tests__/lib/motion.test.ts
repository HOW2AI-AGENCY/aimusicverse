/**
 * Unit tests for lib/motion.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { infiniteTransition, shake, springTransition, smoothTransition } from "@/lib/motion";

describe("infiniteTransition", () => {
  it("returns original transition when reduced motion is false", () => {
    const transition = { duration: 1, repeat: Infinity };
    const result = infiniteTransition(transition, false);
    expect(result).toEqual(transition);
  });

  it("returns zero duration when reduced motion is true", () => {
    const transition = { duration: 1, repeat: Infinity };
    const result = infiniteTransition(transition, true);
    expect(result.duration).toBe(0);
  });

  it("strips repeat when reduced motion is true", () => {
    const transition = { duration: 1, repeat: Infinity, repeatType: "loop" };
    const result = infiniteTransition(transition, true);
    expect(result).not.toHaveProperty("repeat");
    expect(result).not.toHaveProperty("repeatType");
  });
});

describe("shake", () => {
  it("has initial and animate states", () => {
    expect(shake.initial).toEqual({ x: 0 });
    expect(shake.animate).toBeDefined();
  });

  it("has correct shake animation values", () => {
    const animate = shake.animate as { x: number[]; transition: { duration: number } };
    expect(animate.x).toEqual([0, -10, 10, -10, 10, 0]);
    expect(animate.transition.duration).toBe(0.5);
  });
});

describe("springTransition", () => {
  it("has spring type", () => {
    expect(springTransition.type).toBe("spring");
  });

  it("has stiffness and damping", () => {
    expect(springTransition.stiffness).toBe(300);
    expect(springTransition.damping).toBe(30);
  });
});

describe("smoothTransition", () => {
  it("has duration", () => {
    expect(smoothTransition.duration).toBe(0.2);
  });
});
