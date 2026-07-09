/**
 * Unit tests for telegram/webhook-setup.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as notificationsApi from "@/api/notifications.api";
import { setupTelegramWebhook } from "@/services/telegram/webhook-setup.service";

vi.mock("@/api/notifications.api", () => ({
  invokeTelegramWebhookSetup: vi.fn(),
}));

describe("telegram/webhook-setup.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("setupTelegramWebhook", () => {
    it("returns webhook info on success", async () => {
      vi.mocked(notificationsApi.invokeTelegramWebhookSetup).mockResolvedValue({
        data: { webhook_url: "https://bot.example.com", webhook_info: { ok: true } },
        error: null,
      });

      const result = await setupTelegramWebhook();

      expect(result.error).toBeNull();
      expect(result.info?.webhook_url).toBe("https://bot.example.com");
    });

    it("returns error on edge function failure", async () => {
      vi.mocked(notificationsApi.invokeTelegramWebhookSetup).mockResolvedValue({
        data: null,
        error: { message: "Webhook setup failed" },
      });

      const result = await setupTelegramWebhook();

      expect(result.info).toBeNull();
      expect(result.error?.message).toBe("Webhook setup failed");
    });

    it("returns null info when data is empty", async () => {
      vi.mocked(notificationsApi.invokeTelegramWebhookSetup).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await setupTelegramWebhook();

      expect(result.info).toBeNull();
      expect(result.error).toBeNull();
    });

    it("catches thrown errors", async () => {
      vi.mocked(notificationsApi.invokeTelegramWebhookSetup).mockRejectedValue(new Error("Network error"));

      const result = await setupTelegramWebhook();

      expect(result.info).toBeNull();
      expect(result.error?.message).toBe("Network error");
    });
  });
});
