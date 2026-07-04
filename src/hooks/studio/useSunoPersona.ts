/**
 * useSunoPersona — mutation hook for training a Suno Persona from a single
 * track via the suno-persona edge function (Sprint 052-B2).
 *
 * Returns a (personaId, sunoTaskId, status) tuple. status === 'pending' means
 * Suno hasn't finalized the persona yet — poll the result with useSunoPersonaStatus
 * (see supabase.from('track_personas').select(...)) or subscribe via realtime.
 */

import { useMutation } from "@tanstack/react-query";
import { sunoPersona, type SunoPersonaParams, type SunoPersonaResult } from "@/services/studio.service";

export type SunoPersonaInput = SunoPersonaParams;

export function useSunoPersona() {
  return useMutation<SunoPersonaResult, Error, SunoPersonaInput>({
    mutationFn: async (input) => {
      const { data, error } = await sunoPersona(input);
      if (error) throw error;
      if (!data) throw new Error("Persona returned no data");
      return data;
    },
  });
}
