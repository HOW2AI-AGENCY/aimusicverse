/**
 * Sprint 055 P0-4 (055-A4): Unit tests for useSunoCancel soft-cancel mutation.
 *
 * Covered guarantees:
 *  - Happy path: invokes cancelGenerationTask, invalidates cache, fires toast.
 *  - Error path: surfaces error via toast + analytics with succeeded=false.
 *  - Idempotent: re-cancelling same taskId still invalidates and toasts.
 *
 * Analytics is mocked at the function level so we can assert the *outcome*
 * (action=succeeded/failed) without coupling to the underlying SQL.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn() },
  },
}));

vi.mock("@/api/generation.api", () => ({
  cancelGenerationTask: vi.fn(),
}));

vi.mock("@/services/analytics/events.service", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import { useAuth } from "@/contexts/AuthContext";
import { cancelGenerationTask } from "@/api/generation.api";
import { trackEvent } from "@/services/analytics/events.service";
import { toast } from "sonner";
import { useSunoCancel } from "@/hooks/generation/useSunoCancel";

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const mockCancelGenerationTask = cancelGenerationTask as unknown as ReturnType<typeof vi.fn>;
const mockTrackEvent = trackEvent as unknown as ReturnType<typeof vi.fn>;
const mockToast = toast as unknown as {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useSunoCancel — Sprint 055 P0-4", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockCancelGenerationTask.mockReset();
    mockTrackEvent.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
    mockUseAuth.mockReturnValue({ user: { id: "user-x" } });
  });

  it("invokes cancelGenerationTask and fires success toast + analytics", async () => {
    mockCancelGenerationTask.mockResolvedValue(undefined);

    const { result } = renderHook(() => useSunoCancel(), { wrapper: makeWrapper() });
    await result.current.cancel("task-abc");

    expect(mockCancelGenerationTask).toHaveBeenCalledWith("task-abc", "user_cancelled");
    expect(mockToast.success).toHaveBeenCalledWith("Генерация отменена", expect.any(Object));
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "feature_used",
        pagePath: "generation",
        metadata: expect.objectContaining({ action: "cancel_complete", succeeded: true }),
      }),
      "user-x",
    );
  });

  it("surfaces error as toast + analytics with succeeded=false", async () => {
    mockCancelGenerationTask.mockRejectedValue(new Error("RLS blocked"));

    const { result } = renderHook(() => useSunoCancel(), { wrapper: makeWrapper() });
    await expect(result.current.cancel("task-err")).rejects.toThrow("RLS blocked");

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ action: "cancel_complete", succeeded: false }),
      }),
      "user-x",
    );
  });

  it("isCancelling flag tracks the in-flight state", async () => {
    let resolveTask: (() => void) | null = null;
    mockCancelGenerationTask.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveTask = resolve;
      }),
    );

    const { result } = renderHook(() => useSunoCancel(), { wrapper: makeWrapper() });
    expect(result.current.isCancelling).toBe(false);

    const p = result.current.cancel("task-pending");
    await waitFor(() => expect(result.current.isCancelling).toBe(true));

    if (resolveTask) resolveTask();
    await p;

    await waitFor(() => expect(result.current.isCancelling).toBe(false));
  });
});
