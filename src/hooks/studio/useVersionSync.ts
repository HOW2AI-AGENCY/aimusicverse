/**
 * useVersionSync
 * Hook to sync studio track versions with database track_versions table
 * 
 * P1 Enhancement: Added Realtime sync for multi-client collaboration
 */

import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { StudioTrackVersion } from '@/stores/useUnifiedStudioStore';
import { logger } from '@/lib/logger';

interface DBTrackVersion {
  id: string;
  track_id: string;
  audio_url: string;
  version_label: string;
  version_type?: string;
  is_primary: boolean;
  cover_url?: string;
  duration_seconds?: number;
  transcription_data?: {
    transcription_id?: string;
    midi_url?: string;
    mxml_url?: string;
    gp5_url?: string;
    pdf_url?: string;
    notes_count?: number;
    bpm?: number;
    key?: string;
    time_signature?: string;
  };
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface UseVersionSyncOptions {
  trackId?: string;
  enabled?: boolean;
  enableRealtime?: boolean; // P1: Option to enable/disable Realtime sync
}

export function useVersionSync({ 
  trackId, 
  enabled = true,
  enableRealtime = true,
}: UseVersionSyncOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch versions from database
  const { 
    data: dbVersions, 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['track-versions', trackId],
    queryFn: async () => {
      if (!trackId) return [];
      
      const { data, error } = await supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as DBTrackVersion[];
    },
    enabled: enabled && !!trackId,
  });

  // P1 Enhancement: Realtime sync for version changes
  useEffect(() => {
    if (!trackId || !enabled || !enableRealtime) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Subscribe to version changes for this track
    const channel = supabase
      .channel(`track-versions-${trackId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'track_versions',
          filter: `track_id=eq.${trackId}`,
        },
        (payload) => {
          logger.debug('Version Realtime update received', { 
            event: payload.eventType,
            trackId,
            versionId: (payload.new as DBTrackVersion)?.id || (payload.old as { id?: string })?.id,
          });
          
          // Invalidate query to refetch latest data
          queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('Subscribed to version Realtime channel', { trackId });
        } else if (status === 'CHANNEL_ERROR') {
          logger.warn('Version Realtime channel error', { trackId });
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount or trackId change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [trackId, enabled, enableRealtime, queryClient]);

  // Convert DB versions to Studio format
  const studioVersions: StudioTrackVersion[] = (dbVersions || []).map(v => ({
    id: v.id,
    label: v.version_label,
    audioUrl: v.audio_url,
    duration: v.duration_seconds,
    transcription: v.transcription_data ? {
      midiUrl: v.transcription_data.midi_url,
      mxmlUrl: v.transcription_data.mxml_url,
      gp5Url: v.transcription_data.gp5_url,
      pdfUrl: v.transcription_data.pdf_url,
    } : undefined,
    metadata: {
      version_type: v.version_type,
      created_at: v.created_at,
      is_primary: v.is_primary,
      ...(v.metadata || {}),
    },
  }));

  // Save version to database
  const saveVersionMutation = useMutation({
    mutationFn: async (version: {
      label: string;
      audioUrl: string;
      duration?: number;
      versionType?: string;
      isPrimary?: boolean;
      metadata?: Record<string, unknown>;
    }) => {
      if (!trackId) throw new Error('No track ID');

      // Use the RPC function to ensure version exists
      const { data: versionId, error } = await supabase.rpc('ensure_track_version', {
        p_track_id: trackId,
        p_audio_url: version.audioUrl,
        p_label: version.label,
        p_version_type: version.versionType || 'manual',
      });

      if (error) throw error;

      // Fetch the created version
      const { data, error: fetchError } = await supabase
        .from('track_versions')
        .select('id, version_label, audio_url')
        .eq('id', versionId)
        .single();

      if (fetchError) throw fetchError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
    },
    onError: (error) => {
      logger.error('Failed to save version', error instanceof Error ? error : new Error(String(error)));
      toast.error('Ошибка сохранения версии');
    },
  });

  // Link transcription to version
  const linkTranscriptionMutation = useMutation({
    mutationFn: async ({ versionId, transcriptionId }: { versionId: string; transcriptionId: string }) => {
      // Call the database function
      const { data, error } = await supabase.rpc('link_transcription_to_version', {
        p_transcription_id: transcriptionId,
        p_version_id: versionId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
      toast.success('Транскрипция привязана к версии');
    },
    onError: (error) => {
      logger.error('Failed to link transcription', error instanceof Error ? error : new Error(String(error)));
      toast.error('Ошибка привязки транскрипции');
    },
  });

  // Ensure version exists for audio URL
  const ensureVersionMutation = useMutation({
    mutationFn: async ({ audioUrl, label = 'A', versionType = 'original' }: {
      audioUrl: string;
      label?: string;
      versionType?: string;
    }) => {
      if (!trackId) throw new Error('No track ID');

      const { data, error } = await supabase.rpc('ensure_track_version', {
        p_track_id: trackId,
        p_audio_url: audioUrl,
        p_label: label,
        p_version_type: versionType,
      });

      if (error) throw error;
      return data as string; // Returns version ID
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
    },
  });

  // Get version with transcription data
  const getVersionWithTranscription = useCallback((versionId: string) => {
    return dbVersions?.find(v => v.id === versionId);
  }, [dbVersions]);

  // Check if version has transcription
  const hasTranscription = useCallback((versionId: string) => {
    const version = dbVersions?.find(v => v.id === versionId);
    return !!(version?.transcription_data?.midi_url || version?.transcription_data?.mxml_url);
  }, [dbVersions]);

  return {
    // Data
    dbVersions,
    studioVersions,
    isLoading,
    error,

    // Actions
    refetch,
    saveVersion: saveVersionMutation.mutateAsync,
    isSaving: saveVersionMutation.isPending,
    linkTranscription: linkTranscriptionMutation.mutateAsync,
    isLinking: linkTranscriptionMutation.isPending,
    ensureVersion: ensureVersionMutation.mutateAsync,

    // Helpers
    getVersionWithTranscription,
    hasTranscription,
  };
}
