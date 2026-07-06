/**
 * Unit tests for notifications.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  sendVideoShareNotification,
  getNotificationSettings,
  upsertNotificationSettings,
  upsertOnboardingNotificationSettings,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  invokeTelegramWebhookSetup,
} from "@/api/notifications.api";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };

function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["select", "insert", "update", "upsert", "eq", "order", "limit", "single", "maybeSingle"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single.mockReturnValue(Promise.resolve(result));
  chain.maybeSingle.mockReturnValue(Promise.resolve(result));
  const thenable = { ...chain };
  thenable.then = (resolve: (v: unknown) => void) => resolve(result);
  for (const m of Object.keys(chain)) {
    if (m !== "then") chain[m].mockReturnValue(thenable);
  }
  return chain;
}

beforeEach(() => vi.clearAllMocks());

describe("notifications.api", () => {
  describe("sendVideoShareNotification", () => {
    it("invokes send-telegram-notification", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: null });
      await sendVideoShareNotification({
        type: "video_share",
        trackId: "t1",
        videoUrl: "https://video.mp4",
        title: "My Song",
      });
      expect(mockFunctions.invoke).toHaveBeenCalledWith("send-telegram-notification", {
        body: { type: "video_share", trackId: "t1", videoUrl: "https://video.mp4", title: "My Song" },
      });
    });

    it("throws on error", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "send failed" } });
      await expect(
        sendVideoShareNotification({ type: "video_share", trackId: "t1", videoUrl: "v.mp4", title: "T" }),
      ).rejects.toThrow("send failed");
    });
  });

  describe("getNotificationSettings", () => {
    it("fetches settings for user", async () => {
      const settings = { user_id: "u1", push_enabled: true };
      mockFrom.mockReturnValue(chainMock({ data: settings, error: null }));
      const res = await getNotificationSettings("u1");
      expect(res.data).toEqual(settings);
    });
  });

  describe("upsertNotificationSettings", () => {
    it("upserts notification settings", async () => {
      const chain = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);
      const res = await upsertNotificationSettings({ user_id: "u1", push_enabled: true });
      expect(res.error).toBeNull();
      expect(chain.upsert).toHaveBeenCalled();
    });

    it("returns error on failure", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "upsert failed" } }));
      const res = await upsertNotificationSettings({ user_id: "u1" });
      expect(res.error).toBeTruthy();
    });
  });

  describe("upsertOnboardingNotificationSettings", () => {
    it("upserts with updated_at timestamp", async () => {
      const chain = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);
      const res = await upsertOnboardingNotificationSettings({
        user_id: "u1",
        notify_completed: true,
        notify_likes: false,
      });
      expect(res.error).toBeNull();
      expect(chain.upsert).toHaveBeenCalled();
    });

    it("returns error on failure", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "onboarding upsert failed" } }));
      const res = await upsertOnboardingNotificationSettings({ user_id: "u1" });
      expect(res.error).toBeTruthy();
    });
  });

  describe("getNotifications", () => {
    it("fetches notifications with default limit 50", async () => {
      mockFrom.mockReturnValue(chainMock({ data: [{ id: "n1" }], error: null }));
      const res = await getNotifications("u1");
      expect(res.data).toEqual([{ id: "n1" }]);
    });

    it("applies unreadOnly filter", async () => {
      const chain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      await getNotifications("u1", { unreadOnly: true });
      // eq called twice: once for user_id, once for read=false
      expect(chain.eq).toHaveBeenCalledWith("read", false);
    });

    it("applies custom limit", async () => {
      const chain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      await getNotifications("u1", { limit: 10 });
      expect(chain.limit).toHaveBeenCalledWith(10);
    });
  });

  describe("markNotificationRead", () => {
    it("marks notification as read", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await markNotificationRead("n1");
      expect(res.error).toBeNull();
    });
  });

  describe("markAllNotificationsRead", () => {
    it("marks all unread as read", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await markAllNotificationsRead("u1");
      expect(res.error).toBeNull();
    });
  });

  describe("invokeTelegramWebhookSetup", () => {
    it("invokes telegram-webhook-setup", async () => {
      const webhookData = { webhook_url: "https://hook.example.com", webhook_info: {} };
      mockFunctions.invoke.mockResolvedValue({ data: webhookData, error: null });
      const res = await invokeTelegramWebhookSetup();
      expect(res.data).toEqual(webhookData);
      expect(res.error).toBeNull();
    });

    it("returns error message on failure", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "webhook failed" } });
      const res = await invokeTelegramWebhookSetup();
      expect(res.error?.message).toBe("webhook failed");
    });

    it("returns null error on success", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: {}, error: null });
      const res = await invokeTelegramWebhookSetup();
      expect(res.error).toBeNull();
    });
  });
});
