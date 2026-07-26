/**
 * Mid-Suno API — MIDI via SunoAPI `/api/v1/midi/generate`.
 *
 * Simple mode (2 stems): call without audioId → MIDI for all tracks.
 * Detailed mode (6+ stems): call with audioId for a specific stem.
 *
 * Flow: stem separation → get taskId → call generateSunoMidi → poll/getSunoMidiStatus
 */

import { supabase } from "@/integrations/supabase/client";

export interface SunoMidiParams {
  taskId: string;
  audioId?: string;
  userId: string;
}

export interface SunoMidiAccepted {
  success: true;
  taskId: string;
}

export interface SunoMidiNote {
  pitch: number;
  startTime: number;
  duration: number;
  velocity: number;
  instrument?: string | null;
}

export interface SunoMidiStatus {
  success: boolean;
  taskId?: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  midiUrl?: string | null;
  notes?: SunoMidiNote[];
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
