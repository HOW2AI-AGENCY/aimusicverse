/**
 * Sprint 053-A6: Unit tests for suno-boost-style wiring via useGenerateFormValidation.
 *
 * Decision (recorded in SPRINT-053-A6 retro): CONNECT the existing `suno-boost-style`
 * edge to the generate form. The plumbing already exists end-to-end:
 *   StyleSection → FormFieldActions.onAIAssist → onBoostStyle → handleBoostStyle →
 *   supabase.functions.invoke('suno-boost-style') → updates style or description
 * depending on mode.
 *
 * What this test guarantees:
 *  - The edge is invoked with `{ content }` body
 *  - In 'simple' mode, the boosted text updates `description` (not `style`)
 *  - In 'custom' mode, the boosted text updates `style` (not `description`)
 *  - boostLoading state toggles correctly (true during call, false after)
 *  - Empty input is rejected without invoking the edge
 *  - Edge fallback (when AI returns boostedStyle === original) still updates the field
 *  - Edge error is surfaced via toast but does NOT throw
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGenerateFormValidation } from "@/hooks/generation/useGenerateFormValidation";

// Mocks
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import * as supabaseClient from "@/integrations/supabase/client";
import * as toastModule from "sonner";

function setupValidationHook(mode: "simple" | "custom", description: string, style: string) {
  const setDescription = vi.fn();
  const setStyle = vi.fn();
  const setAudioFile = vi.fn();
  const setAudioDuration = vi.fn();

  const { result } = renderHook(() =>
    useGenerateFormValidation({
      mode,
      description,
      style,
      setDescription,
      setStyle,
      setAudioFile,
      setAudioDuration,
    }),
  );

  return { result, setDescription, setStyle };
}

describe("useGenerateFormValidation.handleBoostStyle (Sprint 053-A6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. invokes suno-boost-style edge with { content } body", async () => {
    vi.mocked(supabaseClient.supabase.functions.invoke).mockResolvedValue({
      data: {
        boostedStyle: "Рок-баллада с гитарами [Жанр: Рок] [Настроение: Энергичный]",
        original: "энергичный рок",
        length: 70,
      },
      error: null,
    });

    const { result } = setupValidationHook("custom", "test description", "энергичный рок");

    await act(async () => {
      await result.current.handleBoostStyle();
    });

    expect(supabaseClient.supabase.functions.invoke).toHaveBeenCalledWith("suno-boost-style", {
      body: { content: "энергичный рок" },
    });
  });

  it("2. updates style (not description) in custom mode", async () => {
    const boosted = "Улучшенное описание стиля [Жанр: Поп] [Настроение: Весёлый]";
    vi.mocked(supabaseClient.supabase.functions.invoke).mockResolvedValue({
      data: { boostedStyle: boosted, original: "весёлая песня", length: 80 },
      error: null,
    });

    const { result, setDescription, setStyle } = setupValidationHook("custom", "моё описание", "весёлая песня");

    await act(async () => {
      await result.current.handleBoostStyle();
    });

    expect(setStyle).toHaveBeenCalledWith(boosted);
    expect(setDescription).not.toHaveBeenCalled();
  });

  it("3. updates description (not style) in simple mode", async () => {
    const boosted = "Улучшенное описание [Жанр: Инди] [Настроение: Грустный]";
    vi.mocked(supabaseClient.supabase.functions.invoke).mockResolvedValue({
      data: { boostedStyle: boosted, original: "грустная песня", length: 65 },
      error: null,
    });

    const { result, setDescription, setStyle } = setupValidationHook("simple", "грустная песня", "ignored style");

    await act(async () => {
      await result.current.handleBoostStyle();
    });

    expect(setDescription).toHaveBeenCalledWith(boosted);
    expect(setStyle).not.toHaveBeenCalled();
  });

  it("4. does not invoke edge when input is empty", async () => {
    const { result } = setupValidationHook("custom", "ignored", "");

    await act(async () => {
      await result.current.handleBoostStyle();
    });

    expect(supabaseClient.supabase.functions.invoke).not.toHaveBeenCalled();
    expect(toastModule.toast.error).toHaveBeenCalledWith("Пожалуйста, заполните описание стиля");
  });

  it("5. toggles boostLoading state correctly", async () => {
    let resolveInvoke: (value: unknown) => void = () => {};
    vi.mocked(supabaseClient.supabase.functions.invoke).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveInvoke = resolve;
        }),
    );

    const { result } = setupValidationHook("custom", "ignored", "some style text");

    // Start the boost call but don't await
    let boostPromise: Promise<void>;
    act(() => {
      boostPromise = result.current.handleBoostStyle();
    });

    // Loading should now be true
    expect(result.current.boostLoading).toBe(true);

    // Resolve the invoke
    await act(async () => {
      resolveInvoke({
        data: { boostedStyle: "Улучшено", original: "some style text", length: 8 },
        error: null,
      });
      await boostPromise!;
    });

    // Loading should now be false
    expect(result.current.boostLoading).toBe(false);
  });

  it("6. applies fallback (boostedStyle === original) gracefully", async () => {
    vi.mocked(supabaseClient.supabase.functions.invoke).mockResolvedValue({
      data: {
        boostedStyle: "оригинал без изменений",
        original: "оригинал без изменений",
        length: 21,
        fallback: true,
      },
      error: null,
    });

    const { result, setStyle } = setupValidationHook("custom", "ignored", "оригинал без изменений");

    await act(async () => {
      await result.current.handleBoostStyle();
    });

    // Even with fallback, the field is updated (no special-case in current hook)
    expect(setStyle).toHaveBeenCalledWith("оригинал без изменений");
    expect(toastModule.toast.success).toHaveBeenCalled();
  });

  it("7. surfaces edge error via toast without throwing", async () => {
    // Supabase client throws FunctionsHttpError on non-2xx; the hook catches it
    // and routes via errorMessage.includes("500"|"502"|"Edge Function")
    vi.mocked(supabaseClient.supabase.functions.invoke).mockRejectedValue(
      new Error("Edge Function returned a non-2xx status code: 500"),
    );

    const { result } = setupValidationHook("custom", "ignored", "test style");

    // Must not throw
    await act(async () => {
      await result.current.handleBoostStyle();
    });

    expect(toastModule.toast.error).toHaveBeenCalledWith(
      "Сервис временно недоступен",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(result.current.boostLoading).toBe(false);
  });

  it("8. surfaces insufficient-credits error specifically", async () => {
    // Supabase FunctionsHttpError wraps the underlying message — we match on
    // the substring "кредитов" in the catch branch.
    vi.mocked(supabaseClient.supabase.functions.invoke).mockRejectedValue(new Error("Недостаточно кредитов (429)"));

    const { result } = setupValidationHook("custom", "ignored", "test style");

    await act(async () => {
      await result.current.handleBoostStyle();
    });

    expect(toastModule.toast.error).toHaveBeenCalledWith("Недостаточно кредитов", expect.any(Object));
  });
});
