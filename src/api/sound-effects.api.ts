/**
 * Sprint 053-A1: API layer for Suno SFX generation.
 *
 * All Suno interactions go through edge functions. The client never touches
 * `sound_effects` directly — the callback writes to the DB and the status
 * edge function reads it back. This keeps typed Database schema clean
 * (sound_effects not yet in generated types) and follows Sprint 052 patterns.
 */

import { supabase } from "@/integrations/supabase/client";

export interface SunoSoundsParams {
  prompt: string;
  model?: "V5" | "V4_5ALL" | "V4_5" | "V4";
  tempo?: number;
  key?: "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B";
  duration?: number;
  userId: string;
}

export interface SunoSoundsAccepted {
  success: true;
  taskId: string;
}

export interface SunoSoundsStatus {
  success: boolean;
  status: "processing" | "completed" | "failed";
  audio_url?: string | null;
  image_url?: string | null;
  duration?: number | null;
  prompt?: string;
  error?: string;
}

export async function generateSunoSounds(params: SunoSoundsParams): Promise<SunoSoundsAccepted> {
  const { data, error } = await supabase.functions.invoke<SunoSoundsAccepted>("suno-sounds", {
    body: params,
  });
  if (error) throw new Error(error.message || "Suno SFX generation failed");
  if (!data?.taskId) throw new Error("suno-sounds returned no taskId");
  return data;
}

export async function getSunoSoundsStatus(taskId: string): Promise<SunoSoundsStatus> {
  const { data, error } = await supabase.functions.invoke<SunoSoundsStatus>("suno-sounds-status", {
    body: { taskId },
  });
  if (error) throw new Error(error.message || "Failed to fetch SFX status");
  return data ?? { success: false, status: "processing", error: "no data" };
}
