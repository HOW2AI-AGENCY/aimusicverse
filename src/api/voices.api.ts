/**
 * Voices API
 * Direct Supabase database operations for voice management
 *
 * This module handles:
 * - Custom voice CRUD operations
 * - Voice task tracking
 * - Voice library management
 * - Database queries for voice cloning workflow
 *
 * @see src/services/voice/VoiceCloneService.ts for business logic
 * @see src/hooks/useVoiceCloning.ts for React hooks
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Custom voice entity (database)
 */
export interface CustomVoice {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  sample_url: string;
  waveform_url?: string;
  duration_seconds?: number;
  is_verified: boolean;
  provider_voice_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: {
    language?: string;
    style?: string;
    singerSkillLevel?: string;
    vocalType?: string;
    genre?: string;
    mood?: string;
  };
}

/**
 * Voice task entity (database)
 */
export interface VoiceTask {
  id: string;
  user_id: string;
  voice_id?: string;

  // Validate phase
  validate_task_id?: string;
  validate_phrase?: string;
  validate_status?: VoiceTaskStatus;

  // Generate phase
  generate_task_id?: string;
  recording_url?: string;
  generate_status?: VoiceTaskStatus;

  // Final result
  provider_voice_id?: string;

  created_at: string;
  updated_at: string;
  completed_at?: string;
}

/**
 * Voice task status
 */
export type VoiceTaskStatus =
  | 'pending'
  | 'processing'
  | 'processing_validate'
  | 'processing_validate_fail'
  | 'processing_record'
  | 'processing_record_fail'
  | 'completed'
  | 'failed';

/**
 * Voice library item (for UI display)
 */
export interface VoiceLibraryItem {
  id: string;
  name: string;
  description?: string;
  sample_url: string;
  duration_seconds?: number;
  created_at: string;
  is_favorite?: boolean;
  usage_count?: number;
}

// ============================================================================
// VOICE CRUD OPERATIONS
// ============================================================================

/**
 * Create custom voice record
 */
export async function createCustomVoice(voice: Omit<CustomVoice, 'id' | 'created_at' | 'updated_at'>): Promise<CustomVoice> {
  const { data, error } = await supabase
    .from('voices')
    .insert({
      ...voice,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get custom voice by ID
 */
export async function getCustomVoiceById(voiceId: string): Promise<CustomVoice | null> {
  const { data, error } = await supabase
    .from('voices')
    .select()
    .eq('id', voiceId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user's voices
 */
export async function getUserVoices(userId: string): Promise<CustomVoice[]> {
  const { data, error } = await supabase
    .from('voices')
    .select()
    .eq('user_id', userId)
    .eq('is_verified', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update custom voice
 */
export async function updateCustomVoice(
  voiceId: string,
  updates: Partial<Omit<CustomVoice, 'id' | 'user_id' | 'created_at'>>
): Promise<CustomVoice> {
  const { data, error } = await supabase
    .from('voices')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', voiceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete custom voice (soft delete)
 */
export async function deleteCustomVoice(voiceId: string): Promise<void> {
  const { error } = await supabase
    .from('voices')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', voiceId);

  if (error) throw error;
}

/**
 * Verify custom voice
 */
export async function verifyCustomVoice(voiceId: string): Promise<CustomVoice> {
  return updateCustomVoice(voiceId, { is_verified: true });
}

// ============================================================================
// VOICE TASK OPERATIONS
// ============================================================================

/**
 * Create voice task
 */
export async function createVoiceTask(task: Omit<VoiceTask, 'id' | 'created_at' | 'updated_at'>): Promise<VoiceTask> {
  const { data, error } = await supabase
    .from('voice_tasks')
    .insert({
      ...task,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get voice task by ID
 */
export async function getVoiceTaskById(taskId: string): Promise<VoiceTask | null> {
  const { data, error } = await supabase
    .from('voice_tasks')
    .select()
    .eq('id', taskId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get voice task by validate_task_id
 */
export async function getVoiceTaskByValidateTaskId(validateTaskId: string): Promise<VoiceTask | null> {
  const { data, error } = await supabase
    .from('voice_tasks')
    .select()
    .eq('validate_task_id', validateTaskId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get voice task by generate_task_id
 */
export async function getVoiceTaskByGenerateTaskId(generateTaskId: string): Promise<VoiceTask | null> {
  const { data, error } = await supabase
    .from('voice_tasks')
    .select()
    .eq('generate_task_id', generateTaskId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update voice task
 */
export async function updateVoiceTask(
  taskId: string,
  updates: Partial<Omit<VoiceTask, 'id' | 'user_id' | 'created_at'>>
): Promise<VoiceTask> {
  const { data, error } = await supabase
    .from('voice_tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark voice task as completed
 */
export async function completeVoiceTask(taskId: string, providerVoiceId: string): Promise<VoiceTask> {
  return updateVoiceTask(taskId, {
    provider_voice_id: providerVoiceId,
    completed_at: new Date().toISOString(),
  });
}

/**
 * Mark voice task as failed
 */
export async function failVoiceTask(taskId: string, status: VoiceTaskStatus): Promise<VoiceTask> {
  return updateVoiceTask(taskId, { status });
}

// ============================================================================
// VOICE LIBRARY OPERATIONS
// ============================================================================

/**
 * Get user's voice library
 */
export async function getVoiceLibrary(userId: string): Promise<VoiceLibraryItem[]> {
  const { data, error } = await supabase
    .from('voices')
    .select('id, name, description, sample_url, duration_seconds, created_at')
    .eq('user_id', userId)
    .eq('is_verified', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Add favorite status (would need separate favorites table)
  return (data || []).map(voice => ({
    ...voice,
    is_favorite: false, // TODO: Implement from favorites table
    usage_count: 0, // TODO: Calculate from track usage
  }));
}

/**
 * Search voices by name or description
 */
export async function searchVoices(userId: string, query: string): Promise<VoiceLibraryItem[]> {
  const { data, error } = await supabase
    .from('voices')
    .select('id, name, description, sample_url, duration_seconds, created_at')
    .eq('user_id', userId)
    .eq('is_verified', true)
    .is('deleted_at', null)
    .or('name.ilike.%query%,description.ilike.%query%', {
      query: `%${query}%`
    })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get voice usage statistics
 */
export async function getVoiceUsageStats(userId: string): Promise<{
  totalVoices: number;
  totalUsage: number;
  mostUsedVoice?: { voiceId: string; name: string; usageCount: number };
}> {
  // Get total voices
  const { count: totalVoices } = await supabase
    .from('voices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_verified', true);

  // TODO: Calculate total usage from tracks table
  const totalUsage = 0;

  return { totalVoices: totalVoices || 0, totalUsage };
}

// ============================================================================
// VOICE CLONING WORKFLOW HELPERS
// ============================================================================

/**
 * Create initial voice task for validation phase
 */
export async function createVoiceValidationTask(
  userId: string,
  validateTaskId: string,
  voiceName?: string,
  description?: string
): Promise<VoiceTask> {
  return createVoiceTask({
    user_id: userId,
    validate_task_id: validateTaskId,
    validate_status: 'pending',
    metadata: voiceName ? { voiceName, description } : undefined,
  });
}

/**
 * Update voice task with validation phrase
 */
export async function updateVoiceTaskWithPhrase(
  taskId: string,
  phrase: string
): Promise<VoiceTask> {
  return updateVoiceTask(taskId, {
    validate_phrase: phrase,
    validate_status: 'completed',
  });
}

/**
 * Update voice task with recording URL
 */
export async function updateVoiceTaskWithRecording(
  taskId: string,
  recordingUrl: string
): Promise<VoiceTask> {
  return updateVoiceTask(taskId, {
    recording_url: recordingUrl,
    generate_status: 'pending',
  });
}

/**
 * Find pending voice tasks for polling
 */
export async function findPendingVoiceTasks(userId: string): Promise<VoiceTask[]> {
  const { data, error } = await supabase
    .from('voice_tasks')
    .select()
    .eq('user_id', userId)
    .is('completed_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Batch verify voices
 */
export async function batchVerifyVoices(voiceIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('voices')
    .update({ is_verified: true, updated_at: new Date().toISOString() })
    .in('id', voiceIds);

  if (error) throw error;
}

/**
 * Cleanup old voice tasks
 */
export async function cleanupOldVoiceTasks(daysOld: number = 7): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from('voice_tasks')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .select();

  if (error) throw error;

  return (data || []).length;
}