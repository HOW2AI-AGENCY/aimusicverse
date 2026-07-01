/**
 * useThemeIdea
 *
 * Mutation hook for generating song theme ideas via the ai-lyrics-assistant
 * edge function. Replaces direct `supabase.functions.invoke` in ConceptStep.
 */

import { useMutation } from "@tanstack/react-query";
import { generateThemeIdea, type GenerateThemeIdeaParams } from "@/services/lyrics/theme-idea.service";

export function useThemeIdea() {
  const mutation = useMutation({
    mutationFn: (params: GenerateThemeIdeaParams) => generateThemeIdea(params),
  });

  return {
    generate: mutation.mutateAsync,
    isGenerating: mutation.isPending,
  };
}
