import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'SyncStaleTasks' });

interface SyncResult {
  success: boolean;
  recovered?: number;
  checked?: number;
  updated?: number;
  completed?: number;
  failed?: number;
  error?: string;
}

export function useSyncStaleTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lastSyncRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  const syncStaleTasks = useCallback(async (showToast = false): Promise<SyncResult | null> => {
    if (!user?.id) return null;
    
    // Prevent concurrent syncs
    if (isSyncingRef.current) {
      log.debug('Sync already in progress, skipping');
      return null;
    }

    // Rate limit: at least 30 seconds between syncs
    const now = Date.now();
    if (now - lastSyncRef.current < 30000) {
      log.debug('Sync rate limited, skipping');
      return null;
    }

    try {
      isSyncingRef.current = true;
      lastSyncRef.current = now;
      
      log.info('Syncing stale tasks');
      
      const { data, error } = await supabase.functions.invoke('sync-stale-tasks', {
        body: { user_id: user.id },
      });

      if (error) {
        log.error('Sync error', { error: error.message });
        return { success: false, error: error.message };
      }

      const result = data as SyncResult;
      log.info('Sync completed', { result });

      // If any tracks were recovered or completed, refresh the queries
      if (result.completed && result.completed > 0) {
        if (showToast) {
          toast.success(`${result.completed} ${result.completed === 1 ? 'трек восстановлен' : 'треков восстановлено'}`, {
            description: 'Треки синхронизированы с сервером',
          });
        }
        
        // Invalidate track queries to refresh the list
        await queryClient.invalidateQueries({ queryKey: ['tracks-infinite'] });
        await queryClient.invalidateQueries({ queryKey: ['tracks'] });
        await queryClient.invalidateQueries({ queryKey: ['active_generations'] });
      }

      if (result.recovered && result.recovered > 0) {
        if (showToast) {
          toast.success(`${result.recovered} ${result.recovered === 1 ? 'трек восстановлен' : 'треков восстановлено'}`, {
            description: 'Данные треков восстановлены из кэша',
          });
        }
        
        await queryClient.invalidateQueries({ queryKey: ['tracks-infinite'] });
        await queryClient.invalidateQueries({ queryKey: ['tracks'] });
      }

      return result;
    } catch (error: any) {
      log.error('Sync error', { error: error.message });
      return { success: false, error: error.message };
    } finally {
      isSyncingRef.current = false;
    }
  }, [user?.id, queryClient]);

  // Sync on mount
  useEffect(() => {
    if (user?.id) {
      // Initial sync on page load
      syncStaleTasks(true);
    }
  }, [user?.id, syncStaleTasks]);

  // Sync on visibility change (when user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        log.info('App became visible, syncing');
        syncStaleTasks(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id, syncStaleTasks]);

  // Periodic sync every 2 minutes if there are active generations
  useEffect(() => {
    if (!user?.id) return;

    const intervalId = setInterval(async () => {
      // Check if there are any pending tasks
      const { data: pendingTasks } = await supabase
        .from('generation_tasks')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .limit(1);

      if (pendingTasks && pendingTasks.length > 0) {
        log.debug('Periodic sync - pending tasks found');
        syncStaleTasks(false);
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(intervalId);
  }, [user?.id, syncStaleTasks]);

  return { syncStaleTasks };
}
