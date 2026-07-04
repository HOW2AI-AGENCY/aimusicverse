/**
 * Sprint 053-A3: Unit tests for useSunoMidi (mutation + status polling).
 *
 * Required: 5 tests per Sprint 052 retro (every TanStack Query mutation hook
 * must have unit tests verifying the mutation is called with correct params).
 *
 * Coverage:
 *  1. requires authenticated user (throws if user is null)
 *  2. invokes suno-midi edge with merged params (userId + trackVersionId)
 *  3. surfaces edge error message
 *  4. throws when response lacks taskId
 *  5. useSunoMidiStatus does not run queryFn when taskId is null
 *  6. (bonus) hook stays idle when taskId is null
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSunoMidi, useSunoMidiMutation, useSunoMidiStatus } from "@/hooks/generation/useSunoMidi";
import * as supabaseClient from "@/integrations/supabase/client";
import * as authContext from "@/contexts/AuthContext";
import * as loggerModule from "@/lib/logger";

// Mocks
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const TEST_USER_ID = "11111111-2222-3333-4444-555555555555";
const TEST_VERSION_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useSunoMidi (Sprint 053-A3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: { id: TEST_USER_ID } as unknown as ReturnType<typeof authContext.useAuth> extends { user: infer U }
        ? U
        : never,
      session: null,
      loading: false,
    });
  });

  it("1. requires an authenticated user", async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
    });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useSunoMidiMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.mutateAsync({ trackVersionId: TEST_VERSION_ID })).rejects.toThrow(
      "User not authenticated",
    );

    expect(supabaseClient.supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it("2. invokes suno-midi edge with userId + trackVersionId", async () => {
    vi.mocked(supabaseClient.supabase.functions.invoke).mockResolvedValue({
      data: { success: true, taskId: "suno-midi-task-123" },
      error: null,
    });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useSunoMidiMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      const out = await result.current.mutateAsync({ trackVersionId: TEST_VERSION_ID });
      expect(out.taskId).toBe("suno-midi-task-123");
    });

    expect(supabaseClient.supabase.functions.invoke).toHaveBeenCalledWith("suno-midi", {
      body: { trackVersionId: TEST_VERSION_ID, userId: TEST_USER_ID },
    });
  });

  it("3. surfaces the edge error message when the edge function fails", async () => {
    vi.mocked(supabaseClient.supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: "Insufficient credits" },
    });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useSunoMidiMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.mutateAsync({ trackVersionId: TEST_VERSION_ID })).rejects.toThrow(
      "Insufficient credits",
    );
  });

  it("4. throws when the response lacks a taskId", async () => {
    vi.mocked(supabaseClient.supabase.functions.invoke).mockResolvedValue({
      data: { success: true } as unknown as { success: true; taskId: string }, // taskId missing
      error: null,
    });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useSunoMidiMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.mutateAsync({ trackVersionId: TEST_VERSION_ID })).rejects.toThrow(
      "suno-midi returned no taskId",
    );
  });

  it("5. useSunoMidiStatus does not run queryFn when taskId is null", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useSunoMidiStatus(null), {
      wrapper: createWrapper(queryClient),
    });

    // query is disabled
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });
    expect(supabaseClient.supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it("6. (bonus) combined hook stays idle when no generation has been kicked off", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useSunoMidi(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.midi).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.generate).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });

  it("7. (bonus) logger.info fires on mutation success", async () => {
    vi.mocked(supabaseClient.supabase.functions.invoke).mockResolvedValue({
      data: { success: true, taskId: "suno-midi-task-xyz" },
      error: null,
    });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useSunoMidiMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ trackVersionId: TEST_VERSION_ID });
    });

    expect(loggerModule.logger.info).toHaveBeenCalledWith(
      "Suno MIDI generation started",
      expect.objectContaining({ taskId: "suno-midi-task-xyz" }),
    );
  });
});
