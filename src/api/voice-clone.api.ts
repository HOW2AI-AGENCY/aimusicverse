import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type CustomVoice = Tables<'custom_voices'>;

async function invoke<T = any>(name: string, body?: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export const voiceCloneApi = {
  list: async (userId: string): Promise<CustomVoice[]> => {
    const { data, error } = await supabase
      .from('custom_voices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  remove: async (id: string) => {
    const { error } = await supabase.from('custom_voices').delete().eq('id', id);
    if (error) throw error;
  },

  uploadSource: async (userId: string, file: Blob, ext = 'mp3'): Promise<string> => {
    const path = `${userId}/source_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('voice-sources').upload(path, file, {
      contentType: (file as any).type || 'audio/mpeg',
      upsert: false,
    });
    if (error) throw error;
    return path;
  },

  uploadVerification: async (userId: string, file: Blob, ext = 'webm'): Promise<string> => {
    const path = `${userId}/verify_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('voice-verifications').upload(path, file, {
      contentType: (file as any).type || 'audio/webm',
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
  }) => invoke<{ success: boolean; voice: CustomVoice; taskId: string }>('suno-voice-validate', params),

  validateInfo: (taskId: string) =>
    invoke<{ success: boolean; status: string; validateInfo?: string }>(
      `suno-voice-validate-info?taskId=${encodeURIComponent(taskId)}`
    ),

  generate: (voiceRowId: string, verifyPath: string) =>
    invoke<{ success: boolean; taskId: string }>('suno-voice-generate', { voiceRowId, verifyPath }),

  regenerate: (voiceRowId: string, verifyPath?: string) =>
    invoke<{ success: boolean; taskId: string }>('suno-voice-regenerate', { voiceRowId, verifyPath }),

  recordInfo: (taskId: string) =>
    invoke<{ success: boolean; status: string; voiceId?: string }>(
      `suno-voice-record-info?taskId=${encodeURIComponent(taskId)}`
    ),

  checkVoice: (voiceId: string) =>
    invoke<{ success: boolean; available: boolean }>('suno-voice-check-voice', { voiceId }),
};
