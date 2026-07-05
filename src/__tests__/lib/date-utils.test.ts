/**
 * Unit tests for lib/date-utils.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { formatDate, isToday, isYesterday, differenceInDays, differenceInHours } from "@/lib/date-utils";

describe("formatDate", () => {
  it("formats date with default format", () => {
    const date = new Date(2026, 0, 15); // Jan 15, 2026
    const result = formatDate(date);
    expect(result).toContain("15");
    expect(result).toContain("01");
    expect(result).toContain("2026");
  });

  it("formats date with custom format", () => {
    const date = new Date(2026, 5, 1); // Jun 1, 2026
    const result = formatDate(date, "YYYY-MM-DD");
    expect(result).toBe("2026-06-01");
  });

  it("handles string input", () => {
    const result = formatDate("2026-01-15");
    expect(result).toContain("15");
  });
});

describe("isToday", () => {
  it("returns true for today", () => {
    expect(isToday(new Date())).toBe(true);
  });

  it("returns false for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });
});

describe("isYesterday", () => {
  it("returns true for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isYesterday(yesterday)).toBe(true);
  });

  it("returns false for today", () => {
    expect(isYesterday(new Date())).toBe(false);
  });
});

describe("differenceInDays", () => {
  it("returns 0 for same day", () => {
    const date = new Date(2026, 0, 15);
    expect(differenceInDays(date, date)).toBe(0);
  });

  it("returns positive for future date", () => {
    const date1 = new Date(2026, 0, 15);
    const date2 = new Date(2026, 0, 20);
    expect(differenceInDays(date2, date1)).toBe(5);
  });

  it("returns negative for past date", () => {
    const date1 = new Date(2026, 0, 15);
    const date2 = new Date(2026, 0, 20);
    expect(differenceInDays(date1, date2)).toBe(-5);
  });
});

describe("differenceInHours", () => {
  it("returns 0 for same hour", () => {
    const date = new Date(2026, 0, 15, 10, 0);
    expect(differenceInHours(date, date)).toBe(0);
  });

  it("returns correct difference", () => {
    const date1 = new Date(2026, 0, 15, 10, 0);
    const date2 = new Date(2026, 0, 15, 13, 0);
    expect(differenceInHours(date2, date1)).toBe(3);
  });
});
