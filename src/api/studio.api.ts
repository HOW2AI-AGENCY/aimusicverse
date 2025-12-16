/**
 * Studio API Layer
 * Raw Supabase operations for studio functionality
 */

import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type TrackVersion = Tables<'track_versions'>;
export type TrackStem = Tables<'track_stems'>;
export type GuitarRecording = Tables<'guitar_recordings'>;
export type GenerationTask = Tables<'generation_tasks'>;
export type TrackChangeLog = Tables<'track_change_log'>;

// ============= Track Versions =============

export async function fetchTrackVersions(trackId: string) {
  const { data, error } = await supabase
    .from('track_versions')
    .select('*')
    .eq('track_id', trackId)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function setPrimaryVersion(trackId: string, versionId: string) {
  // First, unset all primary versions for this track
  await supabase
    .from('track_versions')
    .update({ is_primary: false })
    .eq('track_id', trackId);

  // Set the new primary version
  const { data, error } = await supabase
    .from('track_versions')
    .update({ is_primary: true })
    .eq('id', versionId)
    .select()
    .single();

  // Update track's audio_url to match the new primary version
  if (data?.audio_url) {
    await supabase
      .from('tracks')
      .update({ audio_url: data.audio_url })
      .eq('id', trackId);
  }

  return { data, error };
}

// ============= Track Stems =============

export async function fetchTrackStems(trackId: string) {
  const { data, error } = await supabase
    .from('track_stems')
    .select('*')
    .eq('track_id', trackId)
    .order('created_at', { ascending: false });

  return { data, error };
}

// ============= Stem Separation =============

export async function invokeStemSeparation(params: {
  trackId: string;
  audioId: string;
  audioUrl: string;
  mode: 'simple' | 'detailed';
  userId: string;
}) {
  const { data, error } = await supabase.functions.invoke('suno-separate-vocals', {
    body: params,
  });

  return { data, error };
}

// ============= Section Replacement Generation =============

export async function invokeReplaceSection(params: {
  trackId: string;
  userId: string;
  taskId: string;
  audioId: string;
  startTime: number;
  endTime: number;
  prompt: string;
  tags?: string[];
  lyrics?: string;
}) {
  const { data, error } = await supabase.functions.invoke('suno-replace-section', {
    body: params,
  });

  return { data, error };
}

// ============= Replaced Sections (via generation_tasks) =============

export async function fetchReplacedSectionTasks(trackId: string) {
  const { data, error } = await supabase
    .from('generation_tasks')
    .select(`
      id,
      suno_task_id,
      status,
      prompt,
      created_at,
      completed_at,
      audio_clips
    `)
    .eq('track_id', trackId)
    .eq('generation_mode', 'replace_section')
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function fetchSectionReplacementLogs(trackId: string) {
  const [startedLogs, completedLogs] = await Promise.all([
    supabase
      .from('track_change_log')
      .select('id, created_at, metadata')
      .eq('track_id', trackId)
      .eq('change_type', 'replace_section_started')
      .order('created_at', { ascending: false }),
    supabase
      .from('track_change_log')
      .select(`
        id,
        metadata,
        version_id,
        track_versions (
          audio_url
        )
      `)
      .eq('track_id', trackId)
      .eq('change_type', 'replace_section_completed')
      .order('created_at', { ascending: false }),
  ]);

  return {
    startedLogs: startedLogs.data,
    completedLogs: completedLogs.data,
    error: startedLogs.error || completedLogs.error,
  };
}

// ============= Guitar Analysis =============

export async function fetchGuitarAnalysis(trackId: string) {
  const { data, error } = await supabase
    .from('guitar_recordings')
    .select('*')
    .eq('track_id', trackId)
    .maybeSingle();

  return { data, error };
}

// ============= Generation Tasks =============

export async function fetchGenerationTask(taskId: string) {
  const { data, error } = await supabase
    .from('generation_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  return { data, error };
}

export function subscribeToGenerationTask(
  taskId: string,
  callback: (task: GenerationTask) => void
) {
  return supabase
    .channel(`generation-task-${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'generation_tasks',
        filter: `id=eq.${taskId}`,
      },
      (payload) => callback(payload.new as GenerationTask)
    )
    .subscribe();
}

// ============= Track Change Log =============

export async function logTrackActivity(params: {
  trackId: string;
  userId: string;
  changeType: string;
  changedBy: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from('track_change_log').insert([{
    track_id: params.trackId,
    user_id: params.userId,
    change_type: params.changeType,
    changed_by: params.changedBy,
    field_name: params.fieldName,
    old_value: params.oldValue,
    new_value: params.newValue,
    metadata: params.metadata as unknown as import('@/integrations/supabase/types').Json,
  }]);

  return { error };
}
