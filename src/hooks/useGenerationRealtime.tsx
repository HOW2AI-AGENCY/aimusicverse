import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook for automatically updating generation status via Supabase Realtime.
 * It refetches the react-query cache when changes occur in generation_tasks or tracks.
 */
export const useGenerationRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const realtimeChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!user?.id) return;

    const setupRealtime = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.warn('Max reconnect attempts for generation status reached.');
        return;
      }

      try {
        realtimeChannel.current = supabase
          .channel(`generation_updates_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'generation_tasks',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('Realtime update for generation_tasks:', payload);
              reconnectAttempts.current = 0;
              
              // Check if generation completed
              const newData = payload.new as { status?: string; track_id?: string };
              if (newData?.status === 'completed') {
                console.log('🎉 Generation completed, refetching tracks...');
                toast.success('Трек готов! 🎵');
                
                // Force refetch tracks to show the new track
                queryClient.refetchQueries({ queryKey: ['tracks-infinite'] });
                queryClient.refetchQueries({ queryKey: ['tracks'] });
              }
              
              // Invalidate active generations query
              queryClient.invalidateQueries({ queryKey: ['active_generations'] });
              queryClient.invalidateQueries({ queryKey: ['generation_tasks'] });
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tracks',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('Realtime update for tracks:', payload);
              reconnectAttempts.current = 0;
              
              // Check if track is now completed with audio
              const newData = payload.new as { status?: string; audio_url?: string };
              if (newData?.status === 'completed' && newData?.audio_url) {
                console.log('🎵 Track completed with audio, refetching...');
                queryClient.refetchQueries({ queryKey: ['tracks-infinite'] });
                queryClient.refetchQueries({ queryKey: ['tracks'] });
              }
              
              queryClient.invalidateQueries({ queryKey: ['active_generations'] });
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'track_versions',
            },
            (payload) => {
              console.log('Realtime update for track_versions (new version):', payload);
              // New version created - refetch tracks and versions
              queryClient.invalidateQueries({ queryKey: ['track_versions'] });
              queryClient.refetchQueries({ queryKey: ['tracks-infinite'] });
            }
          )
          .subscribe((status) => {
            console.log('Generation Realtime status:', status);

            if (status === 'CHANNEL_ERROR') {
              reconnectAttempts.current++;
              const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
              setTimeout(() => {
                if (realtimeChannel.current) {
                  supabase.removeChannel(realtimeChannel.current);
                }
                setupRealtime();
              }, backoffMs);
            } else if (status === 'SUBSCRIBED') {
              reconnectAttempts.current = 0;
            }
          });
      } catch (error) {
        console.error('Error setting up generation realtime:', error);
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
