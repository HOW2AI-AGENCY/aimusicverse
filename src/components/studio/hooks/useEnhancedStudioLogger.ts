/**
 * Enhanced Studio Activity Logger
 * Extended logging for studio actions with metrics tracking
 */

import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const studioLogger = logger.child({ module: 'Studio' });

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
  | 'extend_start'
  | 'midi_export'
  | 'analyze_start'
  | 'onboarding_start'
  | 'onboarding_complete'
  | 'onboarding_skip'
  | 'tip_view'
  | 'tip_dismiss'
  | 'tip_action';

export type StudioState =
  | 'idle'
  | 'selecting'
  | 'editing'
  | 'processing'
  | 'comparing'
  | 'mixing';

interface ActivityMetadata {
  trackId?: string;
  versionId?: string;
  sectionStart?: number;
  sectionEnd?: number;
  stemType?: string;
  value?: number | string | boolean;
  state?: StudioState;
  tipId?: string;
  duration?: number;
  [key: string]: unknown;
}

interface StudioMetrics {
  sessionStart: number;
  actionCount: number;
  stateHistory: { state: StudioState; timestamp: number }[];
  actionsPerformed: StudioAction[];
  timeInStates: Record<StudioState, number>;
}

export function useEnhancedStudioLogger(trackId: string) {
  const sessionIdRef = useRef<string | null>(null);
  const metricsRef = useRef<StudioMetrics>({
    sessionStart: Date.now(),
    actionCount: 0,
    stateHistory: [{ state: 'idle', timestamp: Date.now() }],
    actionsPerformed: [],
    timeInStates: {
      idle: 0,
      selecting: 0,
      editing: 0,
      processing: 0,
      comparing: 0,
      mixing: 0,
    },
  });

  // Generate session ID on first use
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `studio_${trackId}_${Date.now()}`;
      metricsRef.current.sessionStart = Date.now();
    }
    return sessionIdRef.current;
  }, [trackId]);

  // Update state tracking
  const updateState = useCallback((newState: StudioState) => {
    const metrics = metricsRef.current;
    const now = Date.now();
    const lastEntry = metrics.stateHistory[metrics.stateHistory.length - 1];
    
    if (lastEntry && lastEntry.state !== newState) {
      // Calculate time spent in previous state
      const timeInPrevState = now - lastEntry.timestamp;
      metrics.timeInStates[lastEntry.state] += timeInPrevState;
      
      // Add new state to history
      metrics.stateHistory.push({ state: newState, timestamp: now });
    }
  }, []);

  // Log activity to database and console
  const logActivity = useCallback(async (
    action: StudioAction,
    metadata?: ActivityMetadata
  ) => {
    const sessionId = getSessionId();
    const sessionDuration = Date.now() - metricsRef.current.sessionStart;
    
    // Update metrics
    metricsRef.current.actionCount++;
    metricsRef.current.actionsPerformed.push(action);
    
    // Log to console
    studioLogger.debug(`Action: ${action}`, {
      trackId,
      sessionId,
      sessionDuration,
      actionCount: metricsRef.current.actionCount,
      ...metadata,
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Log important actions to track_change_log
      const importantActions: StudioAction[] = [
        'replacement_apply',
        'replacement_discard',
        'version_switch',
        'stem_separate_complete',
        'export_complete',
        'trim_complete',
        'onboarding_complete',
      ];

      if (importantActions.includes(action)) {
        await supabase.from('track_change_log').insert({
          track_id: trackId,
          change_type: action,
          changed_by: 'user',
          user_id: user.id,
          new_value: JSON.stringify({
            ...metadata,
            sessionId,
            sessionDuration,
            actionCount: metricsRef.current.actionCount,
          }),
          version_id: metadata?.versionId,
        });
      }
    } catch (error) {
      studioLogger.error('Failed to log studio activity', error);
    }
  }, [trackId, getSessionId]);

  // Log session end on unmount
  useEffect(() => {
    return () => {
      const metrics = metricsRef.current;
      const sessionDuration = Date.now() - metrics.sessionStart;
      
      studioLogger.info('Studio session ended', {
        trackId,
        sessionId: sessionIdRef.current,
        sessionDuration,
        totalActions: metrics.actionCount,
        actionsPerformed: [...new Set(metrics.actionsPerformed)],
        timeInStates: metrics.timeInStates,
      });
    };
  }, [trackId]);

  // Convenience methods
  const logPlay = useCallback(() => logActivity('play'), [logActivity]);
  const logPause = useCallback(() => logActivity('pause'), [logActivity]);
  const logSeek = useCallback((time: number) => logActivity('seek', { value: time }), [logActivity]);

  const logSectionSelect = useCallback((start: number, end: number) => {
    updateState('selecting');
    return logActivity('section_select', { sectionStart: start, sectionEnd: end });
  }, [logActivity, updateState]);

  const logSectionPreview = useCallback((start: number, end: number) =>
    logActivity('section_preview', { sectionStart: start, sectionEnd: end }), [logActivity]);

  const logReplacementStart = useCallback((start: number, end: number) => {
    updateState('editing');
    return logActivity('replacement_start', { sectionStart: start, sectionEnd: end });
  }, [logActivity, updateState]);

  const logReplacementComplete = useCallback((versionId: string) => {
    updateState('comparing');
    return logActivity('replacement_complete', { versionId });
  }, [logActivity, updateState]);

  const logReplacementApply = useCallback((versionId: string) => {
    updateState('idle');
    return logActivity('replacement_apply', { versionId });
  }, [logActivity, updateState]);

  const logReplacementDiscard = useCallback(() => {
    updateState('idle');
    return logActivity('replacement_discard');
  }, [logActivity, updateState]);

  const logVersionSwitch = useCallback((versionId: string) =>
    logActivity('version_switch', { versionId }), [logActivity]);

  const logStemAction = useCallback((
    stemType: string, 
    action: 'mute' | 'solo' | 'volume', 
    value?: number
  ) => {
    updateState('mixing');
    return logActivity(`stem_${action}`, { stemType, value });
  }, [logActivity, updateState]);

  const logStemSeparateStart = useCallback(() => {
    updateState('processing');
    return logActivity('stem_separate_start');
  }, [logActivity, updateState]);

  const logStemSeparateComplete = useCallback((stemCount: number) => {
    updateState('idle');
    return logActivity('stem_separate_complete', { value: stemCount });
  }, [logActivity, updateState]);

  const logTipView = useCallback((tipId: string) =>
    logActivity('tip_view', { tipId }), [logActivity]);

  const logTipDismiss = useCallback((tipId: string) =>
    logActivity('tip_dismiss', { tipId }), [logActivity]);

  const logTipAction = useCallback((tipId: string, actionId: string) =>
    logActivity('tip_action', { tipId, value: actionId }), [logActivity]);

  const logOnboardingStart = useCallback(() =>
    logActivity('onboarding_start'), [logActivity]);

  const logOnboardingComplete = useCallback(() =>
    logActivity('onboarding_complete'), [logActivity]);

  const logOnboardingSkip = useCallback((step: number) =>
    logActivity('onboarding_skip', { value: step }), [logActivity]);

  // Get current session metrics
  const getMetrics = useCallback(() => ({
    ...metricsRef.current,
    sessionDuration: Date.now() - metricsRef.current.sessionStart,
  }), []);

  return {
    logActivity,
    updateState,
    getMetrics,
    // Playback
    logPlay,
    logPause,
    logSeek,
    // Section replacement
    logSectionSelect,
    logSectionPreview,
    logReplacementStart,
    logReplacementComplete,
    logReplacementApply,
    logReplacementDiscard,
    // Versions
    logVersionSwitch,
    // Stems
    logStemAction,
    logStemSeparateStart,
    logStemSeparateComplete,
    // Tips & Onboarding
    logTipView,
    logTipDismiss,
    logTipAction,
    logOnboardingStart,
    logOnboardingComplete,
    logOnboardingSkip,
  };
}
