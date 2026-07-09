/**
 * Unit tests for hooks/studio/useSunoPersona.ts
 * Sprint 059-B — TanStack Query mutation tests
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/services/studio/studio-operations.service", () => ({
  sunoPersona: vi.fn(),
}));

import { sunoPersona } from "@/services/studio/studio-operations.service";
import { useSunoPersona } from "@/hooks/studio/useSunoPersona";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useSunoPersona", () => {
  const mockInput = { trackId: "t1", name: "My Persona", description: "pop style", model: "chirp-v5" };
  const mockResult = { personaId: "p1", sunoTaskId: "st1", sunoPersonaId: "sp1", status: "pending" as const };

  it("calls sunoPersona service and returns result on success", async () => {
    vi.mocked(sunoPersona).mockResolvedValue({ data: mockResult, error: null });

    const { result } = renderHook(() => useSunoPersona(), { wrapper: makeWrapper() });

    const output = await result.current.mutateAsync(mockInput);

    expect(sunoPersona).toHaveBeenCalledWith(mockInput);
    expect(output).toEqual(mockResult);
  });

  it("throws error when service returns error", async () => {
    vi.mocked(sunoPersona).mockResolvedValue({ data: null, error: new Error("Persona failed") });

    const { result } = renderHook(() => useSunoPersona(), { wrapper: makeWrapper() });

    await expect(result.current.mutateAsync(mockInput)).rejects.toThrow("Persona failed");
  });

  it("throws error when service returns no data", async () => {
    vi.mocked(sunoPersona).mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useSunoPersona(), { wrapper: makeWrapper() });

    await expect(result.current.mutateAsync(mockInput)).rejects.toThrow("Persona returned no data");
  });

  it("isIdle initially, isPending during mutation", async () => {
    let resolve: (() => void) | null = null;
    vi.mocked(sunoPersona).mockReturnValue(
      new Promise((r) => {
        resolve = () => r({ data: mockResult, error: null });
      }),
    );

    const { result } = renderHook(() => useSunoPersona(), { wrapper: makeWrapper() });

    expect(result.current.isIdle).toBe(true);

    const p = result.current.mutateAsync(mockInput);
    await waitFor(() => expect(result.current.isPending).toBe(true));

    if (resolve) resolve();
    await p;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
