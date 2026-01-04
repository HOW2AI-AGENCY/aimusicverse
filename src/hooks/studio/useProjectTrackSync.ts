/**
 * useProjectTrackSync
 * 
 * Realtime synchronization hook for project tracks and versions
 * Listens to track_versions changes and syncs with project state
 */

import { useEffect, useCallback } from 'react';
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

  // Sync versions from database to project
  const syncVersionsFromDb = useCallback(async (trackId: string) => {
    if (!project) return;

    try {
      const { data: dbVersions, error } = await supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: true });

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
      const existingLabels = new Set(projectTrack.versions?.map(v => v.label) || ['A']);
      
      let labelIndex = existingLabels.size;
      
      for (const dbVersion of dbVersions) {
        // Check if version already exists
        const exists = projectTrack.versions?.some(v => 
          v.audioUrl === dbVersion.audio_url ||
          (v as any).id === dbVersion.id
        );

        if (!exists) {
          const newLabel = labels[labelIndex++] || `V${labelIndex}`;
          addTrackVersion(
            projectTrack.id,
            newLabel,
            dbVersion.audio_url,
            dbVersion.duration_seconds || undefined
          );
          logger.info('Synced new version from DB', { trackId, label: newLabel });
        }
      }
    } catch (err) {
      logger.error('Version sync failed', err);
    }
  }, [project, sourceTrackId, addTrackVersion]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!sourceTrackId) return;

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
          syncVersionsFromDb(sourceTrackId);
        }
      )
      .subscribe();

    // Initial sync
    syncVersionsFromDb(sourceTrackId);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sourceTrackId, project, queryClient, syncVersionsFromDb, setTrackActiveVersion]);

  return {
    syncVersionsFromDb,
  };
}
