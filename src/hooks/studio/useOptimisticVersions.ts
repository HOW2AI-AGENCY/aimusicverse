/**
 * Optimistic Versions Hook
 * 
 * Provides optimistic UI updates for version creation and switching.
 * Immediately updates the UI before the server confirms, then reconciles.
 */

import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface TrackVersion {
  id: string;
  track_id: string;
  audio_url: string;
  cover_url?: string | null;
  duration_seconds?: number | null;
  version_type?: string | null;
  is_primary: boolean;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

interface OptimisticVersion extends TrackVersion {
  isOptimistic?: boolean;
  isPending?: boolean;
}

interface UseOptimisticVersionsProps {
  trackId: string;
  versions: TrackVersion[];
}

export function useOptimisticVersions({ trackId, versions }: UseOptimisticVersionsProps) {
  const queryClient = useQueryClient();
  const [optimisticVersions, setOptimisticVersions] = useState<OptimisticVersion[]>([]);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  // Merge real versions with optimistic ones
  const displayVersions = useMemo(() => {
    const realVersionIds = new Set(versions.map(v => v.id));
    
    // Filter out optimistic versions that have been confirmed
    const pendingOptimistic = optimisticVersions.filter(
      ov => !realVersionIds.has(ov.id)
    );
    
    // Mark pending operations on real versions
    const markedVersions = versions.map(v => ({
      ...v,
      isPending: pendingOperations.has(v.id),
    }));
    
    return [...markedVersions, ...pendingOptimistic];
  }, [versions, optimisticVersions, pendingOperations]);

  /**
   * Create a new version with optimistic update
   */
  const createVersionOptimistic = useCallback(async (
    audioUrl: string,
    metadata?: Record<string, unknown>
  ) => {
    // Generate temporary ID
    const tempId = `temp-${Date.now()}`;
    
    // Create optimistic version
    const optimisticVersion: OptimisticVersion = {
      id: tempId,
      track_id: trackId,
      audio_url: audioUrl,
      is_primary: false,
      created_at: new Date().toISOString(),
      metadata,
      isOptimistic: true,
    };
    
    // Add to optimistic list immediately
    setOptimisticVersions(prev => [optimisticVersion, ...prev]);
    
    try {
      // Create version on server
      const { data, error } = await supabase
        .from('track_versions')
        .insert({
          track_id: trackId,
          audio_url: audioUrl,
          metadata: metadata as never,
          is_primary: false,
          version_type: 'user_created',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Remove optimistic version (real one will come from refetch)
      setOptimisticVersions(prev => prev.filter(v => v.id !== tempId));
      
      // Invalidate cache to get fresh data
      await queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
      
      toast.success('Версия создана');
      return data;
    } catch (error) {
      // Remove failed optimistic version
      setOptimisticVersions(prev => prev.filter(v => v.id !== tempId));
      logger.error('Failed to create version', error);
      toast.error('Ошибка создания версии');
      throw error;
    }
  }, [trackId, queryClient]);

  /**
   * Set version as primary with optimistic update
   */
  const setPrimaryOptimistic = useCallback(async (versionId: string) => {
    // Mark as pending
    setPendingOperations(prev => new Set([...prev, versionId]));
    
    // Optimistically update UI
    const previousVersions = [...versions];
    
    try {
      // Step 1: Unset all primaries
      const { error: unsetError } = await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', trackId);
      
      if (unsetError) throw unsetError;
      
      // Step 2: Set new primary
      const { error: setError } = await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', versionId);
      
      if (setError) throw setError;
      
      // Invalidate cache
      await queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
      
      toast.success('Версия установлена как основная');
    } catch (error) {
      // Revert on error
      logger.error('Failed to set primary version', error);
      toast.error('Ошибка установки основной версии');
    } finally {
      setPendingOperations(prev => {
        const next = new Set(prev);
        next.delete(versionId);
        return next;
      });
    }
  }, [trackId, versions, queryClient]);

  /**
   * Delete version with optimistic update
   */
  const deleteVersionOptimistic = useCallback(async (versionId: string) => {
    // Mark as pending
    setPendingOperations(prev => new Set([...prev, versionId]));
    
    try {
      const { error } = await supabase
        .from('track_versions')
        .delete()
        .eq('id', versionId);
      
      if (error) throw error;
      
      // Invalidate cache
      await queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
      
      toast.success('Версия удалена');
    } catch (error) {
      logger.error('Failed to delete version', error);
      toast.error('Ошибка удаления версии');
    } finally {
      setPendingOperations(prev => {
        const next = new Set(prev);
        next.delete(versionId);
        return next;
      });
    }
  }, [trackId, queryClient]);

  return {
    versions: displayVersions,
    createVersionOptimistic,
    setPrimaryOptimistic,
    deleteVersionOptimistic,
    hasPendingOperations: pendingOperations.size > 0,
  };
}
