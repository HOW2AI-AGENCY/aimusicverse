/**
 * Studio Activity Logger Hook
 * Logs user actions in studio for analytics and debugging
 */

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type StudioAction =
  | 'studio_open'
  | 'studio_close'
  | 'play'
  | 'pause'
  | 'seek'
  | 'section_select'
  | 'section_preview'
  | 'replacement_start'
  | 'replacement_complete'
  | 'replacement_apply'
  | 'replacement_discard'
  | 'version_switch'
  | 'version_compare'
  | 'stem_mute'
  | 'stem_solo'
  | 'stem_volume'
  | 'stem_separate_start'
  | 'stem_separate_complete'
  | 'export_start'
  | 'export_complete'
  | 'trim_start'
  | 'trim_complete'
  | 'remix_start'
  | 'extend_start';

interface ActivityMetadata {
  trackId?: string;
  versionId?: string;
  sectionStart?: number;
  sectionEnd?: number;
  stemType?: string;
  value?: number | string | boolean;
  [key: string]: unknown;
}

export function useStudioActivityLogger(trackId: string) {
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<number>(Date.now());

  // Generate session ID on first use
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `studio_${trackId}_${Date.now()}`;
      sessionStartRef.current = Date.now();
    }
    return sessionIdRef.current;
  }, [trackId]);

  const logActivity = useCallback(async (
    action: StudioAction,
    metadata?: ActivityMetadata
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sessionId = getSessionId();
      const sessionDuration = Date.now() - sessionStartRef.current;

      // Log to track_change_log for important actions
      const importantActions = [
        'replacement_apply',
        'replacement_discard',
        'version_switch',
        'stem_separate_complete',
        'export_complete',
        'trim_complete'
      ];

      if (importantActions.includes(action)) {
        await supabase.from('track_change_log').insert({
          track_id: trackId,
          change_type: action,
          changed_by: 'user',
          user_id: user.id,
          new_value: JSON.stringify(metadata || {}),
          version_id: metadata?.versionId,
        });
      }

      // Also log to console in development
      logger.debug(`[Studio Activity] ${action}`, {
        trackId,
        sessionId,
        sessionDuration,
        ...metadata
      });
    } catch (error) {
      logger.error('Failed to log studio activity', error);
    }
  }, [trackId, getSessionId]);

  // Convenience methods for common actions
  const logPlay = useCallback(() => logActivity('play'), [logActivity]);
  const logPause = useCallback(() => logActivity('pause'), [logActivity]);
  const logSeek = useCallback((time: number) => logActivity('seek', { value: time }), [logActivity]);
  
  const logSectionSelect = useCallback((start: number, end: number) => 
    logActivity('section_select', { sectionStart: start, sectionEnd: end }), [logActivity]);
  
  const logReplacementStart = useCallback((start: number, end: number) =>
    logActivity('replacement_start', { sectionStart: start, sectionEnd: end }), [logActivity]);
  
  const logReplacementApply = useCallback((versionId: string) =>
    logActivity('replacement_apply', { versionId }), [logActivity]);
  
  const logReplacementDiscard = useCallback(() =>
    logActivity('replacement_discard'), [logActivity]);
  
  const logVersionSwitch = useCallback((versionId: string) =>
    logActivity('version_switch', { versionId }), [logActivity]);
  
  const logStemAction = useCallback((stemType: string, action: 'mute' | 'solo' | 'volume', value?: number) =>
    logActivity(`stem_${action}`, { stemType, value }), [logActivity]);

  return {
    logActivity,
    logPlay,
    logPause,
    logSeek,
    logSectionSelect,
    logReplacementStart,
    logReplacementApply,
    logReplacementDiscard,
    logVersionSwitch,
    logStemAction,
  };
}
