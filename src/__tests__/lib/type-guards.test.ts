import { describe, it, expect } from "vitest";
import { isModalDialogProps, isSheetDialogProps, isAlertDialogProps } from "@/lib/type-guards";

describe("type-guards", () => {
  it("isModalDialogProps returns true for modal variant", () => {
    expect(isModalDialogProps({ variant: "modal" })).toBe(true);
  });

  it("isModalDialogProps returns false for sheet variant", () => {
    expect(isModalDialogProps({ variant: "sheet" })).toBe(false);
  });

  it("isModalDialogProps returns false for null/undefined", () => {
    expect(isModalDialogProps(null)).toBe(false);
    expect(isModalDialogProps(undefined)).toBe(false);
  });

  it("isSheetDialogProps returns true for sheet variant", () => {
    expect(isSheetDialogProps({ variant: "sheet" })).toBe(true);
  });

  it("isSheetDialogProps returns false for alert variant", () => {
    expect(isSheetDialogProps({ variant: "alert" })).toBe(false);
  });

  it("isAlertDialogProps returns true for alert variant", () => {
    expect(isAlertDialogProps({ variant: "alert" })).toBe(true);
  });

  it("isAlertDialogProps returns false for modal variant", () => {
    expect(isAlertDialogProps({ variant: "modal" })).toBe(false);
  });
});
