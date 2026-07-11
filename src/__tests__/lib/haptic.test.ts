import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Logger pulls in canvas — mock early
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));

import {
  hapticImpact,
  hapticNotification,
  hapticSelectionChanged,
  isHapticAvailable,
  smartHaptic,
  HAPTIC_GUIDE,
} from "@/lib/haptic";

describe("haptic", () => {
  let mockImpactOccurred: ReturnType<typeof vi.fn>;
  let mockNotificationOccurred: ReturnType<typeof vi.fn>;
  let mockSelectionChanged: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockImpactOccurred = vi.fn();
    mockNotificationOccurred = vi.fn();
    mockSelectionChanged = vi.fn();
    (window as Record<string, unknown>).Telegram = {
      WebApp: {
        version: "7.0",
        HapticFeedback: {
          impactOccurred: mockImpactOccurred,
          notificationOccurred: mockNotificationOccurred,
          selectionChanged: mockSelectionChanged,
        },
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (window as Record<string, unknown>).Telegram = undefined;
  });

  it("isHapticAvailable returns true with Telegram 7.0", () => {
    expect(isHapticAvailable()).toBe(true);
  });

  it("hapticImpact calls Telegram API", () => {
    hapticImpact("light");
    expect(mockImpactOccurred).toHaveBeenCalledWith("light");
  });

  it("hapticImpact defaults to medium", () => {
    hapticImpact();
    expect(mockImpactOccurred).toHaveBeenCalledWith("medium");
  });

  it("hapticNotification calls Telegram API", () => {
    hapticNotification("error");
    expect(mockNotificationOccurred).toHaveBeenCalledWith("error");
  });

  it("hapticSelectionChanged calls Telegram API", () => {
    hapticSelectionChanged();
    expect(mockSelectionChanged).toHaveBeenCalled();
  });

  it("isHapticAvailable returns false without Telegram", () => {
    (window as Record<string, unknown>).Telegram = undefined;
    expect(isHapticAvailable()).toBe(false);
  });

  it("smartHaptic dispatches notification type", () => {
    smartHaptic("success");
    expect(mockNotificationOccurred).toHaveBeenCalledWith("success");
  });

  it("smartHaptic dispatches impact type", () => {
    smartHaptic("navigation");
    expect(mockImpactOccurred).toHaveBeenCalledWith("light");
  });

  it("smartHaptic does not throw for unknown action", () => {
    expect(() => smartHaptic("buttonPress" as keyof typeof HAPTIC_GUIDE)).not.toThrow();
  });
});
