/**
 * Sprint 056 — Generate Sheet UX Redesign (Task 1).
 *
 * Cost / balance slice of the generation form.
 *
 * Owns `canGenerate`, `generationCost`, `generationCostBreakdown`, and
 * `userBalance`. Backed by the existing `useUserCredits` query hook so
 * cache invalidation and admin-balance branches are preserved verbatim.
 */

import { useUserCredits } from "@/hooks/useUserCredits";
import type { UseGenerateFormValidationDeps, UseGenerateFormValidationReturn } from "./useGenerateForm.types";

export function useGenerateFormValidation(deps: UseGenerateFormValidationDeps): UseGenerateFormValidationReturn {
  const { model } = deps;

  const { balance, canGenerate, generationCost, apiBalance } = useUserCredits(model);

  // Reserved for the redesign cost-breakdown UI. Empty until the redesign
  // wires up per-line-item cost visualization.
  const generationCostBreakdown: Array<{ label: string; amount: number }> = [];

  // Suppress unused-param warning for fields reserved for the redesign.
  void apiBalance;

  return {
    canGenerate,
    generationCost,
    generationCostBreakdown,
    userBalance: balance ?? null,
  };
}
