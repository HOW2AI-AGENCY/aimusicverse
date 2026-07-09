/**
 * Unit tests for analytics/session.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getOrCreateSessionId,
  getOrCreateJourneySessionId,
  refreshJourneySession,
  getCurrentSessionId,
  hasSessionStartedBeenTracked,
  markSessionStartedAsTracked,
  clearSession,
} from "@/services/analytics/session.service";

describe("analytics/session.service", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("getOrCreateSessionId", () => {
    it("creates new UUID session ID", () => {
      const id = getOrCreateSessionId();
      expect(id).toBeTruthy();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it("returns same ID on second call", () => {
      const id1 = getOrCreateSessionId();
      const id2 = getOrCreateSessionId();
      expect(id1).toBe(id2);
    });
  });

  describe("getOrCreateJourneySessionId", () => {
    it("creates session with timestamp prefix", () => {
      const id = getOrCreateJourneySessionId();
      expect(id).toMatch(/^sess_\d+/);
    });

    it("returns same session within expiry", () => {
      const id1 = getOrCreateJourneySessionId();
      const id2 = getOrCreateJourneySessionId();
      expect(id1).toBe(id2);
    });
  });

  describe("refreshJourneySession", () => {
    it("updates timestamp without changing ID", () => {
      const id = getOrCreateJourneySessionId();
      const before = JSON.parse(sessionStorage.getItem("journey_session_id")!);

      // Small delay then refresh
      refreshJourneySession();

      const after = JSON.parse(sessionStorage.getItem("journey_session_id")!);
      expect(after.id).toBe(id);
      expect(after.timestamp).toBeGreaterThanOrEqual(before.timestamp);
    });

    it("does nothing if no journey session exists", () => {
      expect(() => refreshJourneySession()).not.toThrow();
    });
  });

  describe("getCurrentSessionId", () => {
    it("returns null when no session exists", () => {
      expect(getCurrentSessionId()).toBeNull();
    });

    it("returns ID without creating a new one", () => {
      getOrCreateSessionId();
      const id = getCurrentSessionId();
      expect(id).toBeTruthy();
      expect(sessionStorage.getItem("analytics_session_id")).toBe(id);
    });
  });

  describe("hasSessionStartedBeenTracked + markSessionStartedAsTracked", () => {
    it("returns false before tracking", () => {
      getOrCreateSessionId();
      expect(hasSessionStartedBeenTracked()).toBe(false);
    });

    it("returns true after marking", () => {
      getOrCreateSessionId();
      markSessionStartedAsTracked();
      expect(hasSessionStartedBeenTracked()).toBe(true);
    });

    it("returns false when session ID changes (dedup)", () => {
      getOrCreateSessionId();
      markSessionStartedAsTracked();

      // Simulate session change
      sessionStorage.removeItem("analytics_session_id");
      getOrCreateSessionId();

      expect(hasSessionStartedBeenTracked()).toBe(false);
    });
  });

  describe("clearSession", () => {
    it("removes all session keys", () => {
      getOrCreateSessionId();
      getOrCreateJourneySessionId();
      markSessionStartedAsTracked();

      clearSession();

      expect(sessionStorage.getItem("analytics_session_id")).toBeNull();
      expect(sessionStorage.getItem("journey_session_id")).toBeNull();
      expect(sessionStorage.getItem("analytics_session_started")).toBeNull();
    });
  });
});
