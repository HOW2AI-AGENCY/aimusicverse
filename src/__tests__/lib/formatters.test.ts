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
    expect(formatDuration(30)).toBe("30 сек");
  });

  it("formats minutes", () => {
    expect(formatDuration(120)).toBe("2 мин");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(150)).toBe("2 мин 30 сек");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0 сек");
  });
});

describe("formatBytes", () => {
  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 Б");
  });

  it("formats bytes", () => {
    expect(formatBytes(1024)).toBe("1 КБ");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1048576)).toBe("1 МБ");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1 ГБ");
  });

  it("handles decimals correctly", () => {
    expect(formatBytes(1536)).toBe("1.5 КБ");
  });
});

describe("truncate", () => {
  it("returns text unchanged if shorter than max", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long text with ellipsis", () => {
    expect(truncate("hello world", 5)).toBe("hell…");
  });

  it("handles exact length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("");
  });
});
