/**
 * Studio Change Log Hook
 * Structured logging and tracking of all studio actions
 * Stores history in track_change_log for audit trail
 */

import { useCallback } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import type { Json } from '@/integrations/supabase/types';

export type StudioChangeType = 
  | 'section_replacement_started'
  | 'section_replacement_completed'
  | 'section_replacement_discarded'
  | 'section_replacement_applied'
  | 'stem_separation_started'
  | 'stem_separation_completed'
  | 'stem_separation_failed'
  | 'stem_muted'
  | 'stem_unmuted'
  | 'stem_solo'
  | 'stem_volume_changed'
  | 'stem_effect_applied'
  | 'version_created'
  | 'version_switched'
  | 'version_set_primary'
  | 'track_trimmed'
  | 'track_extended'
  | 'track_remixed'
  | 'studio_opened'
  | 'studio_closed';

export interface StudioChangeEntry {
  id: string;
  track_id: string;
  change_type: StudioChangeType;
  changed_by: 'user' | 'system';
  user_id: string | null;
  version_id: string | null;
  old_value: string | null;
  new_value: string | null;
  field_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface LogChangeOptions {
  versionId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  fieldName?: string | null;
  metadata?: Json;
  changedBy?: 'user' | 'system';
}

export function useStudioChangeLog(trackId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch change log for track
  const { data: changeLog, isLoading, refetch } = useQuery({
    queryKey: ['studio-change-log', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_change_log')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as StudioChangeEntry[];
    },
    enabled: !!trackId,
    staleTime: 30000,
  });

  // Log a change
  const logMutation = useMutation({
    mutationFn: async ({
      changeType,
      options = {},
    }: {
      changeType: StudioChangeType;
      options?: LogChangeOptions;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('track_change_log')
        .insert([{
          track_id: trackId,
          change_type: changeType,
          changed_by: options.changedBy || 'user',
          user_id: user.id,
          version_id: options.versionId || null,
          old_value: options.oldValue || null,
          new_value: options.newValue || null,
          field_name: options.fieldName || null,
          metadata: options.metadata || null,
        }]);

      if (error) throw error;

      logger.debug(`[StudioChangeLog] ${changeType}`, {
        trackId,
        ...options,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-change-log', trackId] });
    },
    onError: (error) => {
      logger.error('Failed to log studio change', error);
    },
  });

  // Helper functions for common actions
  const logSectionReplacementStart = useCallback((
    sectionStart: number,
    sectionEnd: number,
    prompt?: string,
    tags?: string[]
  ) => {
    return logMutation.mutateAsync({
      changeType: 'section_replacement_started',
      options: {
        metadata: {
          sectionStart,
          sectionEnd,
          prompt,
          tags,
          timestamp: Date.now(),
        },
      },
    });
  }, [logMutation]);

  const logSectionReplacementComplete = useCallback((
    taskId: string,
    versionId: string,
    audioUrls: string[],
    sectionStart: number,
    sectionEnd: number
  ) => {
    return logMutation.mutateAsync({
      changeType: 'section_replacement_completed',
      options: {
        versionId,
        metadata: {
          taskId,
          audioUrls,
          sectionStart,
          sectionEnd,
          timestamp: Date.now(),
        },
      },
    });
  }, [logMutation]);

  const logSectionReplacementApplied = useCallback((
    versionId: string,
    variant: 'variantA' | 'variantB'
  ) => {
    return logMutation.mutateAsync({
      changeType: 'section_replacement_applied',
      options: {
        versionId,
        newValue: variant,
        metadata: { timestamp: Date.now() },
      },
    });
  }, [logMutation]);

  const logSectionReplacementDiscarded = useCallback(() => {
    return logMutation.mutateAsync({
      changeType: 'section_replacement_discarded',
      options: {
        metadata: { timestamp: Date.now() },
      },
    });
  }, [logMutation]);

  const logStemSeparationStart = useCallback((mode: 'simple' | 'detailed') => {
    return logMutation.mutateAsync({
      changeType: 'stem_separation_started',
      options: {
        newValue: mode,
        metadata: { timestamp: Date.now() },
      },
    });
  }, [logMutation]);

  const logStemSeparationComplete = useCallback((
    stemTypes: string[],
    stemCount: number
  ) => {
    return logMutation.mutateAsync({
      changeType: 'stem_separation_completed',
      options: {
        metadata: { 
          stemTypes, 
          stemCount,
          timestamp: Date.now(),
        },
      },
    });
  }, [logMutation]);

  const logStemAction = useCallback((
    stemId: string,
    stemType: string,
    action: 'muted' | 'unmuted' | 'solo' | 'volume_changed',
    value?: number
  ) => {
    const changeType: StudioChangeType = 
      action === 'muted' ? 'stem_muted' :
      action === 'unmuted' ? 'stem_unmuted' :
      action === 'solo' ? 'stem_solo' : 'stem_volume_changed';
    
    return logMutation.mutateAsync({
      changeType,
      options: {
        fieldName: stemType,
        newValue: value?.toString(),
        metadata: { 
          stemId, 
          stemType, 
          action,
          value,
          timestamp: Date.now(),
        },
      },
    });
  }, [logMutation]);

  const logVersionSwitch = useCallback((
    oldVersionId: string | null,
    newVersionId: string
  ) => {
    return logMutation.mutateAsync({
      changeType: 'version_switched',
      options: {
        versionId: newVersionId,
        oldValue: oldVersionId,
        newValue: newVersionId,
        metadata: { timestamp: Date.now() },
      },
    });
  }, [logMutation]);

  const logStudioSession = useCallback((action: 'opened' | 'closed') => {
    return logMutation.mutateAsync({
      changeType: action === 'opened' ? 'studio_opened' : 'studio_closed',
      options: {
        metadata: { 
          timestamp: Date.now(),
          sessionId: `studio_${trackId}_${Date.now()}`,
        },
      },
    });
  }, [logMutation, trackId]);

  return {
    changeLog,
    isLoading,
    refetch,
    
    // Generic log function
    logChange: logMutation.mutate,
    logChangeAsync: logMutation.mutateAsync,
    
    // Specific helpers
    logSectionReplacementStart,
    logSectionReplacementComplete,
    logSectionReplacementApplied,
    logSectionReplacementDiscarded,
    logStemSeparationStart,
    logStemSeparationComplete,
    logStemAction,
    logVersionSwitch,
    logStudioSession,
    
    isLogging: logMutation.isPending,
  };
}

// Get human-readable label for change type
export function getChangeTypeLabel(type: StudioChangeType): string {
  const labels: Record<StudioChangeType, string> = {
    section_replacement_started: 'Замена секции начата',
    section_replacement_completed: 'Секция заменена',
    section_replacement_discarded: 'Замена отменена',
    section_replacement_applied: 'Замена применена',
    stem_separation_started: 'Разделение на стемы',
    stem_separation_completed: 'Стемы готовы',
    stem_separation_failed: 'Ошибка разделения',
    stem_muted: 'Стем заглушён',
    stem_unmuted: 'Стем включён',
    stem_solo: 'Соло стема',
    stem_volume_changed: 'Громкость изменена',
    stem_effect_applied: 'Эффект применён',
    version_created: 'Версия создана',
    version_switched: 'Версия изменена',
    version_set_primary: 'Активная версия',
    track_trimmed: 'Трек обрезан',
    track_extended: 'Трек расширен',
    track_remixed: 'Ремикс создан',
    studio_opened: 'Студия открыта',
    studio_closed: 'Студия закрыта',
  };
  return labels[type] || type;
}

// Get icon name for change type
export function getChangeTypeIcon(type: StudioChangeType): string {
  if (type.startsWith('section_replacement')) return 'scissors';
  if (type.startsWith('stem_')) return 'music';
  if (type.startsWith('version_')) return 'git-branch';
  if (type.includes('trim')) return 'crop';
  if (type.includes('extend')) return 'expand';
  if (type.includes('remix')) return 'wand';
  if (type.includes('studio')) return 'monitor';
  return 'activity';
}
