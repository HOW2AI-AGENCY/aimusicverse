/**
 * Unit tests for hooks/studio/useSunoFileUpload.ts
 * Sprint 059-B — TanStack Query mutation tests
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/services/studio/studio-operations.service", () => ({
  sunoFileUpload: vi.fn(),
}));

import { sunoFileUpload } from "@/services/studio/studio-operations.service";
import { useSunoFileUpload } from "@/hooks/studio/useSunoFileUpload";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useSunoFileUpload", () => {
  const mockInput = { filename: "audio.mp3", fileBase64: "base64data..." };
  const mockResult = { file_url: "https://cdn.suno.ai/upload/abc.mp3", expires_in_days: 3 };

  it("calls sunoFileUpload service and returns result on success", async () => {
    vi.mocked(sunoFileUpload).mockResolvedValue({ data: mockResult, error: null });

    const { result } = renderHook(() => useSunoFileUpload(), { wrapper: makeWrapper() });

    const output = await result.current.mutateAsync(mockInput);

    expect(sunoFileUpload).toHaveBeenCalledWith(mockInput);
    expect(output).toEqual(mockResult);
  });

  it("throws error when service returns error", async () => {
    vi.mocked(sunoFileUpload).mockResolvedValue({ data: null, error: new Error("Upload failed") });

    const { result } = renderHook(() => useSunoFileUpload(), { wrapper: makeWrapper() });

    await expect(result.current.mutateAsync(mockInput)).rejects.toThrow("Upload failed");
  });

  it("throws error when service returns no data", async () => {
    vi.mocked(sunoFileUpload).mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useSunoFileUpload(), { wrapper: makeWrapper() });

    await expect(result.current.mutateAsync(mockInput)).rejects.toThrow("File upload returned no data");
  });

  it("isIdle initially, isPending during mutation", async () => {
    let resolve: (() => void) | null = null;
    vi.mocked(sunoFileUpload).mockReturnValue(
      new Promise((r) => {
        resolve = () => r({ data: mockResult, error: null });
      }),
    );

    const { result } = renderHook(() => useSunoFileUpload(), { wrapper: makeWrapper() });

    expect(result.current.isIdle).toBe(true);

    const p = result.current.mutateAsync(mockInput);
    await waitFor(() => expect(result.current.isPending).toBe(true));

    if (resolve) resolve();
    await p;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
