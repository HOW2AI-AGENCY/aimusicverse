import { describe, it, expect } from "vitest";
import { validateTouchTarget, getTouchTargetPadding, TOUCH_TARGET_MIN_SIZE, touchTarget } from "@/lib/touch-target";

describe("touch-target", () => {
  it("validateTouchTarget returns true for 44x44", () => {
    expect(validateTouchTarget(44, 44)).toBe(true);
  });

  it("validateTouchTarget returns false for 20x20", () => {
    expect(validateTouchTarget(20, 20)).toBe(false);
  });

  it("validateTouchTarget returns false when width too small", () => {
    expect(validateTouchTarget(10, 44)).toBe(false);
  });

  it("getTouchTargetPadding returns 0 for 44px content", () => {
    expect(getTouchTargetPadding(44)).toBe(0);
  });

  it("getTouchTargetPadding returns 12 for 20px content", () => {
    expect(getTouchTargetPadding(20)).toBe(12);
  });

  it("getTouchTargetPadding returns ceil for odd diff", () => {
    expect(getTouchTargetPadding(21)).toBe(12); // (44-21)/2 = 11.5 → 12
  });

  it("touchTarget constants are strings", () => {
    expect(typeof touchTarget.min).toBe("string");
    expect(touchTarget.min).toContain("44px");
  });
});
