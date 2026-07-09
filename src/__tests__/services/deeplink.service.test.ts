/**
 * Unit tests for analytics/deeplink.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as analyticsApi from "@/api/analytics.api";

vi.mock("@/api/analytics.api", () => ({
  trackDeeplinkVisit: vi.fn(),
  markDeeplinkConversion: vi.fn(),
  fetchDeeplinkStats: vi.fn(),
  fetchDeeplinkEvents: vi.fn(),
}));

vi.mock("@/services/analytics/session.service", () => ({
  getOrCreateSessionId: vi.fn(),
  getCurrentSessionId: vi.fn(),
}));

import {
  trackDeeplink,
  markConversion,
  fetchDeeplinkStats,
  fetchDeeplinkEvents,
} from "@/services/analytics/deeplink.service";
import { getOrCreateSessionId, getCurrentSessionId } from "@/services/analytics/session.service";

describe("analytics/deeplink.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trackDeeplink", () => {
    it("calls trackDeeplinkVisit with session id and referrer", async () => {
      vi.mocked(getOrCreateSessionId).mockReturnValue("sess-1");
      vi.mocked(analyticsApi.trackDeeplinkVisit).mockResolvedValue();
      // document.referrer defaults to "" in jsdom
      const originalReferrer = document.referrer;

      await trackDeeplink({ deeplinkType: "track", deeplinkValue: "t1", source: "telegram", campaign: "c1" }, "user-1");

      expect(getOrCreateSessionId).toHaveBeenCalled();
      expect(analyticsApi.trackDeeplinkVisit).toHaveBeenCalledWith({
        deeplinkType: "track",
        deeplinkValue: "t1",
        source: "telegram",
        campaign: "c1",
        sessionId: "sess-1",
        referrer: originalReferrer || undefined,
        userId: "user-1",
      });
    });

    it("works without userId", async () => {
      vi.mocked(getOrCreateSessionId).mockReturnValue("sess-2");
      vi.mocked(analyticsApi.trackDeeplinkVisit).mockResolvedValue();

      await trackDeeplink({ deeplinkType: "playlist" });

      expect(analyticsApi.trackDeeplinkVisit).toHaveBeenCalledWith(
        expect.objectContaining({ userId: undefined, deeplinkType: "playlist" }),
      );
    });
  });

  describe("markConversion", () => {
    it("calls markDeeplinkConversion when session exists", async () => {
      vi.mocked(getCurrentSessionId).mockReturnValue("sess-1");
      vi.mocked(analyticsApi.markDeeplinkConversion).mockResolvedValue();

      await markConversion("track_generated");

      expect(analyticsApi.markDeeplinkConversion).toHaveBeenCalledWith("sess-1", "track_generated");
    });

    it("does nothing when no session id", async () => {
      vi.mocked(getCurrentSessionId).mockReturnValue(null);

      await markConversion("track_generated");

      expect(analyticsApi.markDeeplinkConversion).not.toHaveBeenCalled();
    });
  });

  describe("fetchDeeplinkStats", () => {
    it("delegates to analytics api with default period", async () => {
      vi.mocked(analyticsApi.fetchDeeplinkStats).mockResolvedValue({ data: [], error: null } as never);

      await fetchDeeplinkStats();

      expect(analyticsApi.fetchDeeplinkStats).toHaveBeenCalledWith("7 days");
    });

    it("passes explicit time period", async () => {
      vi.mocked(analyticsApi.fetchDeeplinkStats).mockResolvedValue({ data: [], error: null } as never);

      await fetchDeeplinkStats("30 days");

      expect(analyticsApi.fetchDeeplinkStats).toHaveBeenCalledWith("30 days");
    });
  });

  describe("fetchDeeplinkEvents", () => {
    it("delegates with empty options", async () => {
      vi.mocked(analyticsApi.fetchDeeplinkEvents).mockResolvedValue([] as never);

      await fetchDeeplinkEvents();

      expect(analyticsApi.fetchDeeplinkEvents).toHaveBeenCalledWith({});
    });

    it("forwards timeRange and limit options", async () => {
      vi.mocked(analyticsApi.fetchDeeplinkEvents).mockResolvedValue([] as never);

      await fetchDeeplinkEvents({ timeRange: "24h", limit: 50 });

      expect(analyticsApi.fetchDeeplinkEvents).toHaveBeenCalledWith({ timeRange: "24h", limit: 50 });
    });
  });
});
