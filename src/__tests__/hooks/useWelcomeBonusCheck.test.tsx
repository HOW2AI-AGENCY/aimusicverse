/**
 * Sprint 055 P0-5: Unit tests for the TTL guard in useWelcomeBonusCheck.
 *
 * Covered guarantees:
 *  - First-time user with fresh registration_bonus within 5 min → shouldShow = true
 *  - Calling markWelcomeBonusShown stores a JSON envelope with shownAt
 *  - After 30-day TTL, the same envelope flips shouldShow back to true
 *  - Legacy "true" bare flag is treated as expired so users with old flags
 *    get one re-offer, then the new TTL takes over
 *  - Malformed localStorage values do not crash the hook
 *
 * We do NOT mock Date.now — instead the test injects a controllable "now"
 * by writing envelope timestamps relative to a fixed reference instant.
 * That keeps the test pure and avoids time-mocking boilerplate.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Mocks must be declared before importing the hook under test
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [{ created_at: new Date().toISOString() }],
        error: null,
      }),
      // Sprint 055 P0-5: trackEvent path invokes .from().insert() for the
      // user_analytics_events envelope. Without this the rejection leaks.
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

import { useAuth } from "@/contexts/AuthContext";
import { useWelcomeBonusCheck, WELCOME_BONUS_TTL_MS } from "@/hooks/useCreditsLimits";

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const USER_ID = "user-ttl-test";
const STORAGE_KEY = `welcome_bonus_shown_${USER_ID}`;

describe("useWelcomeBonusCheck — Sprint 055 P0-5 TTL guard", () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseAuth.mockReset();
  });

  it("allows showing bonus when no prior flag exists", async () => {
    mockUseAuth.mockReturnValue({ user: { id: USER_ID } });
    const { result } = renderHook(() => useWelcomeBonusCheck(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shouldShowWelcomeBonus).toBe(true);
  });

  it("writes a JSON envelope with shownAt when markWelcomeBonusShown is called", () => {
    mockUseAuth.mockReturnValue({ user: { id: USER_ID } });
    const { result } = renderHook(() => useWelcomeBonusCheck(), { wrapper: makeWrapper() });

    result.current.markWelcomeBonusShown();
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).not.toBe("true"); // NOT the legacy bare-flag
    const parsed = JSON.parse(raw!);
    expect(typeof parsed.shownAt).toBe("string");
    expect(new Date(parsed.shownAt).getTime()).not.toBeNaN();
  });

  it("suppresses bonus when freshly-stored envelope exists", async () => {
    // 1 minute ago — well within 30-day TTL.
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ shownAt: oneMinAgo }));

    mockUseAuth.mockReturnValue({ user: { id: USER_ID } });
    const { result } = renderHook(() => useWelcomeBonusCheck(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shouldShowWelcomeBonus).toBe(false);
  });

  it("re-arms bonus after TTL window (30d+1min)", async () => {
    // 30 days + 1 minute in the past — past TTL.
    const beyond = new Date(Date.now() - WELCOME_BONUS_TTL_MS - 60 * 1000).toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ shownAt: beyond }));

    mockUseAuth.mockReturnValue({ user: { id: USER_ID } });
    const { result } = renderHook(() => useWelcomeBonusCheck(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shouldShowWelcomeBonus).toBe(true);
  });

  it("treats legacy 'true' bare flag as expired (one-time migration offer)", async () => {
    localStorage.setItem(STORAGE_KEY, "true");

    mockUseAuth.mockReturnValue({ user: { id: USER_ID } });
    const { result } = renderHook(() => useWelcomeBonusCheck(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shouldShowWelcomeBonus).toBe(true);
  });

  it("does not crash on malformed JSON in localStorage", async () => {
    localStorage.setItem(STORAGE_KEY, "{not json");

    mockUseAuth.mockReturnValue({ user: { id: USER_ID } });
    const { result } = renderHook(() => useWelcomeBonusCheck(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Malformed → no entry → can show
    expect(result.current.shouldShowWelcomeBonus).toBe(true);
  });
});
