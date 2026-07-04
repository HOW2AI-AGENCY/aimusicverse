/**
 * Sprint 053-A3: API layer for Suno MIDI generation.
 *
 * Edge-bridge pattern (Sprint 052 retro): the client never touches `track_versions`
 * directly. All Suno MIDI orchestration flows through edge functions that resolve
 * the track_version→audio_url mapping server-side and write the result back to
 * `track_versions.midi_url` + `midi_generation_source`.
 */

import { supabase } from "@/integrations/supabase/client";

export interface SunoMidiParams {
  trackVersionId: string;
  userId: string;
}

export interface SunoMidiAccepted {
  success: true;
  taskId: string;
}

export interface SunoMidiStatus {
  success: boolean;
  taskId?: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  midiUrl?: string | null;
  notesCount?: number | null;
  duration?: number | null;
  error?: string;
}

export async function generateSunoMidi(params: SunoMidiParams): Promise<SunoMidiAccepted> {
  const { data, error } = await supabase.functions.invoke<SunoMidiAccepted>("suno-midi", {
    body: params,
  });
  if (error) throw new Error(error.message || "Suno MIDI generation failed");
  if (!data?.taskId) throw new Error("suno-midi returned no taskId");
  return data;
}

export async function getSunoMidiStatus(taskId: string): Promise<SunoMidiStatus> {
  const { data, error } = await supabase.functions.invoke<SunoMidiStatus>("suno-midi-details", {
    body: { taskId },
  });
  if (error) throw new Error(error.message || "Failed to fetch Suno MIDI status");
  return (
    data ?? {
      success: false,
      status: "PROCESSING",
      error: "no data",
    }
  );
}
