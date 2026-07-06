/**
 * Unit tests for analytics/retention.service.ts
 * Sprint 040 — Service Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  trackUserReturn,
  trackFirstGeneration,
  hasTrackedFirstGeneration,
  getFirstGenerationDate,
  getLastVisitDate,
  calculateRetentionDays,
} from "@/services/analytics/retention.service";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe("retention.service", () => {
  describe("trackUserReturn", () => {
    it("returns non-returning for first visit", () => {
      const result = trackUserReturn();
      expect(result.isReturning).toBe(false);
      expect(result.daysSinceLastVisit).toBe(0);
    });

    it("returns returning for same-day visit", () => {
      const today = new Date().toISOString().split("T")[0];
      localStorageMock.setItem("last-visit-date", today);
      const result = trackUserReturn();
      expect(result.isReturning).toBe(false);
    });

    it("calculates days since last visit", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      localStorageMock.setItem("last-visit-date", threeDaysAgo);
      const result = trackUserReturn();
      expect(result.isReturning).toBe(true);
      expect(result.daysSinceLastVisit).toBeGreaterThanOrEqual(2);
    });

    it("saves today's date", () => {
      trackUserReturn();
      expect(localStorageMock.setItem).toHaveBeenCalledWith("last-visit-date", expect.any(String));
    });
  });

  describe("trackFirstGeneration", () => {
    it("returns true on first call", () => {
      expect(trackFirstGeneration()).toBe(true);
    });

    it("returns false on second call", () => {
      trackFirstGeneration();
      expect(trackFirstGeneration()).toBe(false);
    });
  });

  describe("hasTrackedFirstGeneration", () => {
    it("returns false when not tracked", () => {
      expect(hasTrackedFirstGeneration()).toBe(false);
    });

    it("returns true after tracking", () => {
      trackFirstGeneration();
      expect(hasTrackedFirstGeneration()).toBe(true);
    });
  });

  describe("getFirstGenerationDate", () => {
    it("returns null when not set", () => {
      expect(getFirstGenerationDate()).toBeNull();
    });

    it("returns date after tracking", () => {
      trackFirstGeneration();
      const date = getFirstGenerationDate();
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe("getLastVisitDate", () => {
    it("returns null when not set", () => {
      expect(getLastVisitDate()).toBeNull();
    });

    it("returns date after visit", () => {
      trackUserReturn();
      const date = getLastVisitDate();
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe("calculateRetentionDays", () => {
    it("returns null when no first generation", () => {
      expect(calculateRetentionDays()).toBeNull();
    });

    it("returns 0 for same-day generation", () => {
      trackFirstGeneration();
      expect(calculateRetentionDays()).toBe(0);
    });
  });
});
