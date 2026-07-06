/**
 * Unit tests for lib/formatters.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { formatTime, formatDuration, formatBytes, truncate } from "@/lib/formatters";

describe("formatTime", () => {
  it("formats zero seconds", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  it("formats seconds only", () => {
    expect(formatTime(30)).toBe("0:30");
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(90)).toBe("1:30");
  });

  it("formats hours", () => {
    expect(formatTime(3661)).toBe("1:01:01");
  });

  it("handles negative values", () => {
    expect(formatTime(-5)).toBe("0:00");
  });
});

describe("formatDuration", () => {
  it("formats short duration in seconds", () => {
    expect(formatDuration(30)).toContain("30");
  });

  it("formats minutes", () => {
    expect(formatDuration(120)).toContain("2");
  });
});

describe("formatBytes", () => {
  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 ?");
  });

  it("formats bytes", () => {
    expect(formatBytes(1024)).toBe("1 ??");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1048576)).toBe("1 ??");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1 ??");
  });
});

describe("truncate", () => {
  it("returns text unchanged if shorter than max", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long text", () => {
    expect(truncate("hello world", 5)).toBe("hell�");
  });

  it("handles exact length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("");
  });
});
