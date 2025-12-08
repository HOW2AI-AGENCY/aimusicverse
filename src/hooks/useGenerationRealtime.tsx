import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'GenerationRealtime' });

/**
 * Hook for automatically updating generation status via Supabase Realtime.
 * Refetches tracks when generation completes or track status changes.
 */
export const useGenerationRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const realtimeChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!user?.id) return;

    const refetchTracks = () => {
      log.info('Refetching tracks...');
      queryClient.refetchQueries({ queryKey: ['tracks-infinite'] });
      queryClient.refetchQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['active_generations'] });
    };

    const setupRealtime = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.warn('Max reconnect attempts reached.');
        return;
      }

      try {
        realtimeChannel.current = supabase
          .channel(`generation_updates_${user.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'generation_tasks',
            filter: `user_id=eq.${user.id}`
          }, (payload) => {
            log.debug('generation_tasks change', { event: payload.eventType, data: payload.new });
            reconnectAttempts.current = 0;
            
            const newData = payload.new as { status?: string };
            if (newData?.status === 'completed') {
              log.info('Generation completed');
              toast.success('Трек готов! 🎵');
              refetchTracks();
              setTimeout(refetchTracks, 1000);
            } else if (newData?.status === 'failed') {
              toast.error('Ошибка генерации');
              refetchTracks();
            }
            queryClient.invalidateQueries({ queryKey: ['generation_tasks'] });
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'tracks',
            filter: `user_id=eq.${user.id}`
          }, (payload) => {
            const newData = payload.new as { status?: string; audio_url?: string };
            const oldData = payload.old as { status?: string };
            
            log.debug('tracks UPDATE', { oldStatus: oldData?.status, newStatus: newData?.status, hasAudio: !!newData?.audio_url });
            reconnectAttempts.current = 0;
            
            if (newData?.status === 'completed' && oldData?.status !== 'completed') {
              log.info('Track completed');
              refetchTracks();
              setTimeout(refetchTracks, 500);
            } else if (newData?.status === 'streaming_ready') {
              log.info('Track streaming ready');
              refetchTracks();
            }
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'tracks',
            filter: `user_id=eq.${user.id}`
          }, (payload) => {
            log.debug('tracks INSERT');
            reconnectAttempts.current = 0;
            refetchTracks();
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'track_versions',
          }, (payload) => {
            log.debug('track_versions INSERT');
            queryClient.invalidateQueries({ queryKey: ['track_versions'] });
            refetchTracks();
          })
          .subscribe((status) => {
            log.debug('Realtime status', { status });
            if (status === 'CHANNEL_ERROR') {
              reconnectAttempts.current++;
              const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
              setTimeout(() => {
                if (realtimeChannel.current) supabase.removeChannel(realtimeChannel.current);
                setupRealtime();
              }, backoffMs);
            } else if (status === 'SUBSCRIBED') {
              reconnectAttempts.current = 0;
            }
          });
      } catch (error) {
        console.error('Realtime setup error:', error);
        reconnectAttempts.current++;
      }
    };

    setupRealtime();

    return () => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, [user?.id, queryClient]);
};
