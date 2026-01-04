/**
 * Database-backed session store for Telegram bot
 * Replaces in-memory storage for persistence across cold starts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('db-session-store');

export type AudioUploadMode = 'cover' | 'extend' | 'upload';

export interface PendingUpload {
  mode: AudioUploadMode;
  createdAt: number;
  prompt?: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
  model?: string;
  selectedReferenceId?: string;
}

export interface UserSession {
  pendingUpload?: PendingUpload;
  lastActivity: number;
  lastCommand?: string;
  conversationContext?: 'awaiting_audio' | 'awaiting_selection' | 'awaiting_prompt' | null;
}

// Session expiry time (15 minutes)
const SESSION_EXPIRY_MS = 15 * 60 * 1000;

function getSupabase() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Set pending audio upload for user (database-backed)
 */
export async function setPendingUpload(
  telegramUserId: number,
  mode: AudioUploadMode,
  options: Partial<Omit<PendingUpload, 'mode' | 'createdAt'>> = {}
): Promise<void> {
  const supabase = getSupabase();
  
  try {
    // Clear any existing sessions first
    await supabase
      .from('telegram_bot_sessions')
      .delete()
      .eq('telegram_user_id', telegramUserId);

    // Create new session
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
    
    const { error } = await supabase
      .from('telegram_bot_sessions')
      .insert({
        telegram_user_id: telegramUserId,
        session_type: 'pending_upload',
        mode,
        options: {
          ...options,
          createdAt: Date.now(),
        },
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      logger.error('Failed to set pending upload', error);
      throw error;
    }
    
    logger.debug('Set pending upload', { telegramUserId, mode });
  } catch (error) {
    logger.error('Error in setPendingUpload', error);
    throw error;
  }
}

/**
 * Get pending upload without consuming it
 */
export async function getPendingUpload(telegramUserId: number): Promise<PendingUpload | null> {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from('telegram_bot_sessions')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'pending_upload')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    const options = data.options as Record<string, unknown>;
    
    return {
      mode: data.mode as AudioUploadMode,
      createdAt: options.createdAt as number || Date.now(),
      prompt: options.prompt as string | undefined,
      style: options.style as string | undefined,
      title: options.title as string | undefined,
      instrumental: options.instrumental as boolean | undefined,
      model: options.model as string | undefined,
      selectedReferenceId: options.selectedReferenceId as string | undefined,
    };
  } catch (error) {
    logger.error('Error in getPendingUpload', error);
    return null;
  }
}

/**
 * Get and clear pending upload (consume it)
 */
export async function consumePendingUpload(telegramUserId: number): Promise<PendingUpload | null> {
  const supabase = getSupabase();
  
  try {
    // Get the session first
    const pending = await getPendingUpload(telegramUserId);
    
    if (!pending) return null;

    // Delete the session
    await supabase
      .from('telegram_bot_sessions')
      .delete()
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'pending_upload');

    logger.debug('Consumed pending upload', { telegramUserId, mode: pending.mode });
    
    return pending;
  } catch (error) {
    logger.error('Error in consumePendingUpload', error);
    return null;
  }
}

/**
 * Store temporary audio file_id for callback action selection
 */
export async function setPendingAudio(
  telegramUserId: number,
  fileId: string,
  fileType: 'audio' | 'voice' | 'document',
  analysisResult?: {
    style?: string;
    genre?: string;
    mood?: string;
    lyrics?: string;
    hasVocals?: boolean;
  }
): Promise<void> {
  const supabase = getSupabase();
  
  try {
    // Clear any existing pending_audio sessions
    await supabase
      .from('telegram_bot_sessions')
      .delete()
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'pending_audio');

    // Store audio info for 5 minutes (shorter expiry)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    const { error } = await supabase
      .from('telegram_bot_sessions')
      .insert({
        telegram_user_id: telegramUserId,
        session_type: 'pending_audio',
        options: {
          fileId,
          fileType,
          createdAt: Date.now(),
          analysisResult,
        },
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      logger.error('Failed to set pending audio', error);
      throw error;
    }
    
    logger.debug('Set pending audio', { telegramUserId, fileId, fileType, hasAnalysis: !!analysisResult });
  } catch (error) {
    logger.error('Error in setPendingAudio', error);
    throw error;
  }
}

/**
 * Get and consume pending audio file_id
 */
export async function consumePendingAudio(
  telegramUserId: number
): Promise<{ fileId: string; fileType: string; analysisResult?: { style?: string; genre?: string; mood?: string; lyrics?: string; hasVocals?: boolean } } | null> {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from('telegram_bot_sessions')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'pending_audio')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    // Delete the session after consuming
    await supabase
      .from('telegram_bot_sessions')
      .delete()
      .eq('id', data.id);

    const options = data.options as Record<string, unknown>;
    
    return {
      fileId: options.fileId as string,
      fileType: options.fileType as string,
      analysisResult: options.analysisResult as { style?: string; genre?: string; mood?: string } | undefined,
    };
  } catch (error) {
    logger.error('Error in consumePendingAudio', error);
    return null;
  }
}

/**
 * Get pending audio without consuming it (for show_lyrics etc.)
 */
export async function getPendingAudioWithoutConsuming(
  telegramUserId: number
): Promise<{ fileId: string; fileType: string; analysisResult?: { style?: string; genre?: string; mood?: string; lyrics?: string; hasVocals?: boolean } } | null> {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from('telegram_bot_sessions')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'pending_audio')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    const options = data.options as Record<string, unknown>;
    
    return {
      fileId: options.fileId as string,
      fileType: options.fileType as string,
      analysisResult: options.analysisResult as { style?: string; genre?: string; mood?: string; lyrics?: string; hasVocals?: boolean } | undefined,
    };
  } catch (error) {
    logger.error('Error in getPendingAudioWithoutConsuming', error);
    return null;
  }
}

/**
 * Update pending audio analysis results
 */
export async function updatePendingAudioAnalysis(
  telegramUserId: number,
  analysisUpdate: { lyrics?: string; hasVocals?: boolean; genre?: string; mood?: string }
): Promise<void> {
  const supabase = getSupabase();
  
  try {
    const { data, error: fetchError } = await supabase
      .from('telegram_bot_sessions')
      .select('options')
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'pending_audio')
      .single();

    if (fetchError || !data) return;

    const currentOptions = data.options as Record<string, unknown>;
    const currentAnalysis = (currentOptions.analysisResult || {}) as Record<string, unknown>;
    
    const newOptions = {
      ...currentOptions,
      analysisResult: {
        ...currentAnalysis,
        ...analysisUpdate,
      },
    };

    await supabase
      .from('telegram_bot_sessions')
      .update({ options: newOptions })
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'pending_audio');
      
  } catch (error) {
    logger.error('Error in updatePendingAudioAnalysis', error);
  }
}

/**
 * Check if user has pending upload
 */
export async function hasPendingUpload(telegramUserId: number): Promise<boolean> {
  const pending = await getPendingUpload(telegramUserId);
  return pending !== null;
}

/**
 * Update pending upload options
 */
export async function updatePendingUpload(
  telegramUserId: number,
  updates: Partial<Omit<PendingUpload, 'mode' | 'createdAt'>>
): Promise<void> {
  const supabase = getSupabase();
  
  try {
    const { data, error: fetchError } = await supabase
      .from('telegram_bot_sessions')
      .select('options')
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'pending_upload')
      .single();

    if (fetchError || !data) return;

    const currentOptions = data.options as Record<string, unknown>;
    const newOptions = { ...currentOptions, ...updates };

    await supabase
      .from('telegram_bot_sessions')
      .update({ options: newOptions })
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'pending_upload');
      
  } catch (error) {
    logger.error('Error in updatePendingUpload', error);
  }
}

/**
 * Cancel pending upload
 */
export async function cancelPendingUpload(telegramUserId: number): Promise<boolean> {
  const supabase = getSupabase();
  
  try {
    const { data } = await supabase
      .from('telegram_bot_sessions')
      .delete()
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'pending_upload')
      .select();

    return (data?.length || 0) > 0;
  } catch (error) {
    logger.error('Error in cancelPendingUpload', error);
    return false;
  }
}

/**
 * Set conversation context
 */
export async function setConversationContext(
  telegramUserId: number,
  context: UserSession['conversationContext']
): Promise<void> {
  const supabase = getSupabase();
  
  try {
    await supabase
      .from('telegram_bot_sessions')
      .update({ 
        options: { conversationContext: context }
      })
      .eq('telegram_user_id', telegramUserId);
  } catch (error) {
    logger.error('Error in setConversationContext', error);
  }
}

/**
 * Set wizard state for multi-step interactions (edit style, etc.)
 */
export async function setWizardState(
  telegramUserId: number,
  wizardType: string,
  state: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabase();
  
  try {
    // Clear existing wizard state
    await supabase
      .from('telegram_bot_sessions')
      .delete()
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'wizard');

    // Set new wizard state
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await supabase
      .from('telegram_bot_sessions')
      .insert({
        telegram_user_id: telegramUserId,
        session_type: 'wizard',
        mode: wizardType,
        options: { ...state, createdAt: Date.now() },
        expires_at: expiresAt.toISOString(),
      });
      
    logger.debug('Set wizard state', { telegramUserId, wizardType });
  } catch (error) {
    logger.error('Error in setWizardState', error);
  }
}

/**
 * Get wizard state
 */
export async function getWizardState(
  telegramUserId: number
): Promise<{ type: string; state: Record<string, unknown> } | null> {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from('telegram_bot_sessions')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'wizard')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;

    return {
      type: data.mode as string,
      state: data.options as Record<string, unknown>,
    };
  } catch (error) {
    logger.error('Error in getWizardState', error);
    return null;
  }
}

/**
 * Clear wizard state
 */
export async function clearWizardState(telegramUserId: number): Promise<void> {
  const supabase = getSupabase();
  
  try {
    await supabase
      .from('telegram_bot_sessions')
      .delete()
      .eq('telegram_user_id', telegramUserId)
      .eq('session_type', 'wizard');
  } catch (error) {
    logger.error('Error in clearWizardState', error);
  }
}

/**
 * Cleanup expired sessions (called periodically)
 */
export async function cleanupSessions(): Promise<void> {
  const supabase = getSupabase();
  
  try {
    await supabase.rpc('cleanup_expired_bot_sessions');
    logger.debug('Cleaned up expired sessions');
  } catch (error) {
    logger.error('Error cleaning up sessions', error);
  }
}
