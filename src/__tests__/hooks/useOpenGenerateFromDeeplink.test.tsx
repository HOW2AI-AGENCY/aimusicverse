/**
 * Sprint 055-A5d: Unit tests for useOpenGenerateFromDeeplink.
 *
 * Guarantees:
 *  - When URL has `?openGenerate=1`, calls openSheet() exactly once on mount
 *  - Does NOT call openSheet when URL lacks the param
 *  - Does NOT call openSheet when param is anything other than '1'
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mocks must be declared before importing the hook under test
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/analytics/events.service", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/services/analytics/events.service";
import { useOpenGenerateFromDeeplink } from "@/hooks/useOpenGenerateFromDeeplink";

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const mockTrackEvent = trackEvent as unknown as ReturnType<typeof vi.fn>;

function renderWith(initialEntry: string, openSheet: () => void) {
  return renderHook(() => useOpenGenerateFromDeeplink(openSheet), {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>,
  });
}

describe("useOpenGenerateFromDeeplink (Sprint 055 P0-1)", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockTrackEvent.mockReset();
    mockUseAuth.mockReturnValue({ user: { id: "user-test" } });
  });

  it("calls openSheet exactly once when URL has ?openGenerate=1", () => {
    const openSheet = vi.fn();
    renderWith("/?openGenerate=1", openSheet);
    expect(openSheet).toHaveBeenCalledTimes(1);
  });

  it("emits analytics events (open_attempt + open_complete) with userId", () => {
    const openSheet = vi.fn();
    renderWith("/?openGenerate=1", openSheet);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "feature_used",
        pagePath: "deeplink_generate",
        metadata: expect.objectContaining({ action: "open_attempt" }),
      }),
      "user-test",
    );
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ action: "open_complete" }),
      }),
      "user-test",
    );
  });

  it("works without authenticated user (anonymous)", () => {
    mockUseAuth.mockReturnValue({ user: null });
    const openSheet = vi.fn();
    renderWith("/?openGenerate=1", openSheet);
    expect(openSheet).toHaveBeenCalledTimes(1);
    // userId should be undefined when not authenticated
    expect(mockTrackEvent).toHaveBeenCalled();
  });

  it("does NOT call openSheet when param is absent", () => {
    const openSheet = vi.fn();
    renderWith("/", openSheet);
    expect(openSheet).not.toHaveBeenCalled();
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it("does NOT call openSheet when param value is not '1'", () => {
    const openSheet = vi.fn();
    renderWith("/?openGenerate=0", openSheet);
    expect(openSheet).not.toHaveBeenCalled();
  });

  it("does NOT call openSheet when param value is empty string", () => {
    const openSheet = vi.fn();
    renderWith("/?openGenerate=", openSheet);
    expect(openSheet).not.toHaveBeenCalled();
  });
});
