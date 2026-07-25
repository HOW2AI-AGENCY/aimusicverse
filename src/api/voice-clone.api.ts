import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CustomVoice = Tables<"custom_voices">;

export class VoiceApiError extends Error {
  code: string;
  constructor(message: string, code = "UNKNOWN") {
    super(message);
    this.code = code;
  }
}

async function invoke<T = unknown>(name: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body: body as Record<string, unknown> | undefined });
  if (error) throw new VoiceApiError(error.message || "Сетевая ошибка", "NETWORK");
  const response = data as Record<string, unknown> | null;
  if (response?.error) {
    throw new VoiceApiError(String(response.error), String(response.code ?? "SUNO_ERROR"));
  }
  return data as T;
}

export const voiceCloneApi = {
  list: async (userId: string): Promise<CustomVoice[]> => {
    const { data, error } = await supabase
      .from("custom_voices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  remove: async (id: string) => {
    const { error } = await supabase.from("custom_voices").delete().eq("id", id);
    if (error) throw error;
  },

  uploadSource: async (userId: string, file: Blob, ext = "mp3"): Promise<string> => {
    const path = `${userId}/source_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("voice-sources").upload(path, file, {
      contentType: (file as File).type || "audio/mpeg",
      upsert: false,
    });
    if (error) throw error;
    return path;
  },

  uploadVerification: async (userId: string, file: Blob, ext = "webm"): Promise<string> => {
    const path = `${userId}/verify_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("voice-verifications").upload(path, file, {
      contentType: (file as File).type || "audio/webm",
      upsert: false,
    });
    if (error) throw error;
    return path;
  },

  validate: (params: {
    voiceName: string;
    sourcePath: string;
    vocalStartS: number;
    vocalEndS: number;
    language?: string;
    description?: string;
    style?: string;
  }) => invoke<{ success: boolean; voice: CustomVoice; taskId: string }>("suno-voice-validate", params),

  validateInfo: (taskId: string) =>
    invoke<{ success: boolean; status: string; validateInfo?: string }>(
      `suno-voice-validate-info?taskId=${encodeURIComponent(taskId)}`,
    ),

  generate: (voiceRowId: string, verifyPath: string) =>
    invoke<{ success: boolean; taskId: string }>("suno-voice-generate", { voiceRowId, verifyPath }),

  /** Ask Suno for a NEW validation phrase (no audio involved). */
  regenerate: (voiceRowId: string) =>
    invoke<{ success: boolean; taskId: string }>("suno-voice-regenerate", { voiceRowId }),


  recordInfo: (taskId: string) =>
    invoke<{ success: boolean; status: string; voiceId?: string }>(
      `suno-voice-record-info?taskId=${encodeURIComponent(taskId)}`,
    ),

  checkVoice: (voiceId: string) =>
    invoke<{ success: boolean; available: boolean }>("suno-voice-check-voice", { voiceId }),
};

/** localStorage key holding the last custom voice the user generated with. */
export const LAST_VOICE_KEY = "mv:last-custom-voice-id";

export function rememberLastVoice(voiceId: string | null) {
  try {
    if (voiceId) localStorage.setItem(LAST_VOICE_KEY, voiceId);
    else localStorage.removeItem(LAST_VOICE_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function getLastVoice(): string | null {
  try {
    return localStorage.getItem(LAST_VOICE_KEY);
  } catch {
    return null;
  }
}

/**
 * Increment usage_count for a voice after it was used in a generation.
 * Selects the target row first, then updates by primary key (Supabase update quirk).
 */
export async function markVoiceUsed(voiceId: string): Promise<void> {
  const { data } = await supabase
    .from("custom_voices")
    .select("id, usage_count")
    .eq("voice_id", voiceId)
    .maybeSingle();
  if (!data) return;
  await supabase
    .from("custom_voices")
    .update({ usage_count: (data.usage_count ?? 0) + 1 })
    .eq("id", data.id);
}
