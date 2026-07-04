/**
 * Sprint 056 — Generate Sheet UX Redesign (Task 1).
 *
 * Backward-compat smoke test for the useGenerateForm split.
 *
 * Mocks the three brief-named sub-hooks (state / actions / validation)
 * with minimal shapes and verifies that `useGenerateForm` correctly
 * spreads their returns. Real implementations are exercised by the
 * full `npm test` suite (vitest specs in src/__tests__/hooks and
 * tests/unit/). This file exists to lock the composer's merge shape.
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/hooks/generation/useGenerateFormState", () => ({
  useGenerateFormState: vi.fn(() => ({
    style: "rock",
    setStyle: vi.fn(),
    hasUnsavedData: false,
  })),
}));
vi.mock("@/hooks/generation/useGenerateFormActions", () => ({
  useGenerateFormActions: vi.fn(() => ({
    handleGenerate: vi.fn(),
    saveDraft: vi.fn(),
  })),
}));
vi.mock("@/hooks/generation/useGenerateFormValidation", () => ({
  useGenerateFormValidation: vi.fn(() => ({
    canGenerate: true,
    generationCost: 8,
    generationCostBreakdown: [{ label: "base", amount: 8 }],
    userBalance: 42,
  })),
}));

// Mock the legacy internal hooks so the composer can compile and run
// without pulling in their full dependency tree.
vi.mock("@/hooks/generation/useGenerateFormBoostStyle", () => ({
  useGenerateFormBoostStyle: vi.fn(() => ({
    handleBoostStyle: vi.fn(),
    handleSetAudioFile: vi.fn(),
    boostLoading: false,
  })),
}));
vi.mock("@/hooks/generation/useGenerateFormDraft", () => ({
  useGenerateFormDraft: vi.fn(() => ({
    hasDraft: false,
    clearDraft: vi.fn(),
    activeReference: null,
    clearAudioReference: vi.fn(),
  })),
}));

import { useGenerateForm } from "@/hooks/generation/useGenerateForm";

describe("useGenerateForm backward compat (Sprint 056 split)", () => {
  it("merges state, actions, and validation into one object", () => {
    const { result } = renderHook(() =>
      useGenerateForm({ open: true, onOpenChange: vi.fn(), projects: [], artists: [], allTracks: [] }),
    );
    expect(result.current.style).toBe("rock");
    expect(result.current.generationCost).toBe(8);
    expect(typeof result.current.handleGenerate).toBe("function");
    expect(typeof result.current.saveDraft).toBe("function");
  });

  it("exposes generationCostBreakdown array", () => {
    const { result } = renderHook(() =>
      useGenerateForm({ open: true, onOpenChange: vi.fn(), projects: [], artists: [], allTracks: [] }),
    );
    expect(result.current.generationCostBreakdown).toBeDefined();
    expect(Array.isArray(result.current.generationCostBreakdown)).toBe(true);
  });
});
