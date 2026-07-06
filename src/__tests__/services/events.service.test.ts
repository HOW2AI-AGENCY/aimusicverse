/**
 * Unit tests for analytics/events.service.ts
 * Sprint 040 — Service Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  trackEvent,
  trackPageView,
  trackGeneration,
  trackGenerationMetrics,
  trackOnboardingStep,
  trackFeatureUsed,
  trackButtonClick,
  trackTrackPlayed,
  trackTrackLiked,
  trackTrackShared,
} from "@/services/analytics/events.service";

vi.mock("@/api/analytics.api", () => ({
  trackAnalyticsEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/analytics/session.service", () => ({
  getOrCreateSessionId: vi.fn().mockReturnValue("session-123"),
}));

import { trackAnalyticsEvent } from "@/api/analytics.api";

beforeEach(() => vi.clearAllMocks());

describe("events.service", () => {
  describe("trackEvent", () => {
    it("calls trackAnalyticsEvent with session ID", async () => {
      await trackEvent({ eventType: "test_event" });
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: "test_event", sessionId: "session-123" }),
      );
    });

    it("passes userId", async () => {
      await trackEvent({ eventType: "test" }, "u1");
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(expect.objectContaining({ userId: "u1" }));
    });
  });

  describe("trackPageView", () => {
    it("tracks page view event", async () => {
      await trackPageView("/home", { ref: "google" });
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: "page_view", pagePath: "/home" }),
      );
    });
  });

  describe("trackGeneration", () => {
    it("tracks started status", async () => {
      await trackGeneration("started");
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "generation_started" }));
    });

    it("tracks completed status", async () => {
      await trackGeneration("completed");
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "generation_completed" }));
    });

    it("tracks failed status", async () => {
      await trackGeneration("failed");
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "generation_failed" }));
    });

    it("includes timestamp in metadata", async () => {
      await trackGeneration("started", { model: "v5" });
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ model: "v5", timestamp: expect.any(Number) }),
        }),
      );
    });
  });

  describe("trackGenerationMetrics", () => {
    it("tracks generation metrics", async () => {
      await trackGenerationMetrics({
        mode: "custom",
        status: "success",
        duration_ms: 5000,
        model: "v5",
      });
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "generation_metrics",
          metadata: expect.objectContaining({ mode: "custom", status: "success" }),
        }),
      );
    });
  });

  describe("trackOnboardingStep", () => {
    it("tracks onboarding step", async () => {
      await trackOnboardingStep("profile_setup", true);
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "onboarding_step",
          eventName: "profile_setup",
          metadata: expect.objectContaining({ completed: true }),
        }),
      );
    });
  });

  describe("trackFeatureUsed", () => {
    it("tracks feature usage", async () => {
      await trackFeatureUsed("lyrics_editor", { format: "structured" });
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "feature_used",
          eventName: "lyrics_editor",
        }),
      );
    });
  });

  describe("trackButtonClick", () => {
    it("tracks button click", async () => {
      await trackButtonClick("generate_btn");
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: "button_clicked", eventName: "generate_btn" }),
      );
    });
  });

  describe("trackTrackPlayed", () => {
    it("tracks track play", async () => {
      await trackTrackPlayed("t1", { duration: 120 });
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "track_played",
          metadata: expect.objectContaining({ track_id: "t1" }),
        }),
      );
    });
  });

  describe("trackTrackLiked", () => {
    it("tracks like action", async () => {
      await trackTrackLiked("t1", "like");
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "track_liked",
          eventName: "like",
          metadata: expect.objectContaining({ action: "like" }),
        }),
      );
    });

    it("tracks unlike action", async () => {
      await trackTrackLiked("t1", "unlike");
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(expect.objectContaining({ eventName: "unlike" }));
    });
  });

  describe("trackTrackShared", () => {
    it("tracks share", async () => {
      await trackTrackShared("t1", "telegram");
      expect(trackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "track_shared",
          metadata: expect.objectContaining({ share_method: "telegram" }),
        }),
      );
    });
  });
});
