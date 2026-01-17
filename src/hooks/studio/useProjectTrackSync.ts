/**
 * useProjectTrackSync
 * 
 * Realtime synchronization hook for project tracks and versions
 * Listens to track_versions changes and syncs with project state
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedStudioStore, StudioTrackVersion } from '@/stores/useUnifiedStudioStore';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface TrackVersionRecord {
  id: string;
  track_id: string;
  audio_url: string;
  version_label: string;
  duration_seconds: number | null;
  suno_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export function useProjectTrackSync(projectId: string | null, sourceTrackId?: string) {
  const queryClient = useQueryClient();
  const { project, addTrackVersion, setTrackActiveVersion } = useUnifiedStudioStore();
  const isMountedRef = useRef(true);

  // Sync versions from database to project
  const syncVersionsFromDb = useCallback(async (trackId: string, signal?: AbortSignal) => {
    if (!project) return;

    try {
      const query = supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: true });
      
      const { data: dbVersions, error } = signal 
        ? await query.abortSignal(signal)
        : await query;

      if (error) {
        logger.error('Failed to fetch track versions', error);
        return;
      }

      if (!dbVersions?.length) return;

      // Find existing project track
      const projectTrack = project.tracks.find(t => 
        t.id === trackId || 
        (sourceTrackId && project.sourceTrackId === trackId)
      );

      if (!projectTrack) return;

      // Map DB versions to project format
      const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const existingVersions = projectTrack.versions || [];
      const existingAudioUrls = new Set(existingVersions.map(v => v.audioUrl));
      const existingLabels = new Set(existingVersions.map(v => v.label));
      
      let labelIndex = existingLabels.size;
      let versionsAdded = 0;
      
      for (const dbVersion of dbVersions) {
        // BUGFIX: More robust duplicate check using audioUrl
        if (existingAudioUrls.has(dbVersion.audio_url)) {
          continue; // Skip - already exists
        }

        const newLabel = labels[labelIndex++] || `V${labelIndex}`;
        addTrackVersion(
          projectTrack.id,
          newLabel,
          dbVersion.audio_url,
          dbVersion.duration_seconds || undefined
        );
        versionsAdded++;
        logger.info('Synced new version from DB', { trackId, label: newLabel });
      }
      
      // Only log if we actually added versions
      if (versionsAdded > 0) {
        logger.debug('Version sync complete', { trackId, versionsAdded });
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      logger.error('Version sync failed', err);
    }
  }, [project, sourceTrackId, addTrackVersion]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!sourceTrackId) return;

    isMountedRef.current = true;
    const abortController = new AbortController();

    const channel = supabase
      .channel(`track_versions:${sourceTrackId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'track_versions',
          filter: `track_id=eq.${sourceTrackId}`,
        },
        (payload) => {
          if (!isMountedRef.current) return;
          
          const newVersion = payload.new as TrackVersionRecord;
          logger.debug('New track version detected', { versionId: newVersion.id });

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['track-versions', sourceTrackId] });

          // Show notification
          toast.success('Новая версия трека', {
            description: `Версия ${newVersion.version_label || 'B'} готова`,
            action: {
              label: 'Переключить',
              onClick: () => {
                // Find the track in project and switch to new version
                const projectTrack = project?.tracks.find(t => 
                  t.id === sourceTrackId || project.sourceTrackId === sourceTrackId
                );
                if (projectTrack) {
                  setTrackActiveVersion(projectTrack.id, newVersion.version_label || 'B');
                }
              },
            },
          });

          // Sync versions
          syncVersionsFromDb(sourceTrackId, abortController.signal);
        }
      )
      .subscribe();

    // Initial sync
    syncVersionsFromDb(sourceTrackId, abortController.signal);

    return () => {
      isMountedRef.current = false;
      abortController.abort();
      supabase.removeChannel(channel);
    };
  }, [sourceTrackId, project, queryClient, syncVersionsFromDb, setTrackActiveVersion]);

  return {
    syncVersionsFromDb,
  };
}
