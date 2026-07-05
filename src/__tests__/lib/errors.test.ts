/**
 * Unit tests for lib/errors.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { isAppError, getUserErrorMessage } from "@/lib/errors";

describe("isAppError", () => {
  it("returns true for AppError objects", () => {
    const error = { code: "TEST_ERROR", message: "Test", userMessage: "User msg" };
    expect(isAppError(error)).toBe(true);
  });

  it("returns false for regular Error", () => {
    expect(isAppError(new Error("test"))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAppError(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isAppError(undefined)).toBe(false);
  });

  it("returns false for string", () => {
    expect(isAppError("error")).toBe(false);
  });
});

describe("getUserErrorMessage", () => {
  it("returns userMessage from AppError", () => {
    const error = { code: "TEST", message: "internal", userMessage: "User friendly" };
    expect(getUserErrorMessage(error)).toBe("User friendly");
  });

  it("returns message from regular Error", () => {
    expect(getUserErrorMessage(new Error("test error"))).toBe("test error");
  });

  it("returns generic message for unknown errors", () => {
    expect(getUserErrorMessage(null)).toBeTruthy();
    expect(getUserErrorMessage(undefined)).toBeTruthy();
  });

  it("returns message for string errors", () => {
    expect(getUserErrorMessage("something went wrong")).toBeTruthy();
  });
});
