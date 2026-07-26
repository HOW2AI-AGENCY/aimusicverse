/**
 * useStemSeparationTaskForTrack — resolves the latest completed stem separation
 * task for a track. Required to run MIDI generation via SunoAPI, which works on
 * a separation taskId instead of a raw audio URL.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface StemSeparationTaskRow {
  id: string;
  mode: string;
  status: string;
  separation_task_id: string;
  original_audio_id: string;
  created_at: string | null;
}

export function useStemSeparationTaskForTrack(trackId?: string) {
  return useQuery<StemSeparationTaskRow | null>({
    queryKey: ["stem-separation-task", trackId],
    queryFn: async () => {
      if (!trackId) return null;
      const { data, error } = await supabase
        .from("stem_separation_tasks")
        .select("id, mode, status, separation_task_id, original_audio_id, created_at")
        .eq("track_id", trackId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error("[useStemSeparationTaskForTrack] query failed", { trackId, error: error.message });
        return null;
      }
      return (data as StemSeparationTaskRow | null) ?? null;
    },
    enabled: !!trackId,
    staleTime: 60_000,
  });
}
