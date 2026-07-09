/**
 * Unit tests for hooks/studio/useSunoMashup.ts
 * Sprint 059-B — TanStack Query mutation tests
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/services/studio/studio-operations.service", () => ({
  sunoMashup: vi.fn(),
}));

import { sunoMashup } from "@/services/studio/studio-operations.service";
import { useSunoMashup } from "@/hooks/studio/useSunoMashup";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useSunoMashup", () => {
  const mockInput = {
    trackId: "t1",
    referenceTrackId: "t2",
    mixRatio: 0.5,
    projectId: "p1",
  };
  const mockResult = { taskId: "task-1", trackId: "t3" };

  it("calls sunoMashup service and returns result on success", async () => {
    vi.mocked(sunoMashup).mockResolvedValue({ data: mockResult, error: null });

    const { result } = renderHook(() => useSunoMashup(), { wrapper: makeWrapper() });

    const output = await result.current.mutateAsync(mockInput);

    expect(sunoMashup).toHaveBeenCalledWith(mockInput);
    expect(output).toEqual(mockResult);
  });

  it("throws error when service returns error", async () => {
    vi.mocked(sunoMashup).mockResolvedValue({ data: null, error: new Error("Mashup failed") });

    const { result } = renderHook(() => useSunoMashup(), { wrapper: makeWrapper() });

    await expect(result.current.mutateAsync(mockInput)).rejects.toThrow("Mashup failed");
  });

  it("throws error when service returns no data", async () => {
    vi.mocked(sunoMashup).mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useSunoMashup(), { wrapper: makeWrapper() });

    await expect(result.current.mutateAsync(mockInput)).rejects.toThrow("Mashup returned no data");
  });

  it("isIdle initially, isPending during mutation", async () => {
    let resolve: (() => void) | null = null;
    vi.mocked(sunoMashup).mockReturnValue(
      new Promise((r) => {
        resolve = () => r({ data: mockResult, error: null });
      }),
    );

    const { result } = renderHook(() => useSunoMashup(), { wrapper: makeWrapper() });

    expect(result.current.isIdle).toBe(true);

    const p = result.current.mutateAsync(mockInput);
    await waitFor(() => expect(result.current.isPending).toBe(true));

    if (resolve) resolve();
    await p;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
