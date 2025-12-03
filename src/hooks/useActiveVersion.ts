import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface Version {
  id: string;
  track_id: string;
  version_label: string | null;
  clip_index: number | null;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number | null;
  is_primary: boolean | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
}

interface UseActiveVersionReturn {
  activeVersion: Version | null;
  versions: Version[];
  isLoading: boolean;
  versionCount: number;
  switchVersion: (versionId: string) => Promise<void>;
  isSwitching: boolean;
}

export function useActiveVersion(trackId: string, activeVersionId?: string | null): UseActiveVersionReturn {
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeVersion, setActiveVersion] = useState<Version | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchVersions = async () => {
      if (!trackId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', trackId)
        .order('clip_index', { ascending: true });

      if (error) {
        console.error('Error fetching versions:', error);
        setIsLoading(false);
        return;
      }

      const versionData = (data || []) as Version[];
      setVersions(versionData);

      // Determine active version
      let active: Version | null = null;
      if (activeVersionId) {
        active = versionData.find(v => v.id === activeVersionId) || null;
      }
      if (!active) {
        active = versionData.find(v => v.is_primary) || versionData[0] || null;
      }
      setActiveVersion(active);
      setIsLoading(false);
    };

    fetchVersions();

    // Subscribe to version changes
    const channel = supabase
      .channel(`active-version-${trackId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'track_versions',
          filter: `track_id=eq.${trackId}`,
        },
        () => fetchVersions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId, activeVersionId]);

  const switchVersion = useCallback(async (versionId: string) => {
    if (!trackId) return;
    
    setIsSwitching(true);
    try {
      const { error } = await supabase
        .from('tracks')
        .update({ active_version_id: versionId })
        .eq('id', trackId);

      if (error) throw error;

      const newActive = versions.find(v => v.id === versionId);
      if (newActive) {
        setActiveVersion(newActive);
      }

      // Invalidate tracks query to refresh UI
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    } catch (error) {
      console.error('Error switching version:', error);
      throw error;
    } finally {
      setIsSwitching(false);
    }
  }, [trackId, versions, queryClient]);

  return {
    activeVersion,
    versions,
    isLoading,
    versionCount: versions.length,
    switchVersion,
    isSwitching,
  };
}
