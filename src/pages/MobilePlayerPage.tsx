/**
 * MobilePlayerPage - Standalone fullscreen player page for deep links
 * 
 * Accessed via:
 * - /player/:trackId
 * - Deep links: play_{trackId}, player_{trackId}, listen_{trackId}
 * 
 * Automatically loads track and starts playback in fullscreen mode
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { MobileFullscreenPlayer } from '@/components/player/MobileFullscreenPlayer';
import { Loader2, ChevronLeft, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Track } from '@/types/track';
import { logger } from '@/lib/logger';

export default function MobilePlayerPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();
  const { playTrack, setPlayerMode, activeTrack } = usePlayerStore();
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);

  // Fetch track data
  const { data: track, isLoading, error } = useQuery({
    queryKey: ['player-track', trackId],
    queryFn: async () => {
      if (!trackId) throw new Error('No track ID');
      
      const { data, error } = await supabase
        .from('tracks')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            photo_url
          )
        `)
        .eq('id', trackId)
        .single();

      if (error) throw error;
      
      // Transform to Track type with is_liked default
      return {
        ...data,
        is_liked: false, // Will be updated by useLikes hook if needed
      } as Track;
    },
    enabled: !!trackId,
    staleTime: 1000 * 60 * 5,
  });

  // Auto-start playback when track loads
  useEffect(() => {
    if (track && !hasStartedPlayback) {
      logger.info('MobilePlayerPage: Starting playback', { trackId: track.id, title: track.title });
      
      // Set player mode to fullscreen and start playing
      setPlayerMode('fullscreen');
      
      // Small delay to ensure audio element is ready
      const timer = setTimeout(() => {
        playTrack(track);
        setHasStartedPlayback(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [track, hasStartedPlayback, playTrack, setPlayerMode]);

  // Handle back navigation
  const handleBack = () => {
    setPlayerMode('compact');
    navigate('/library', { replace: true });
  };

  // Handle closing fullscreen player
  const handleCloseFullscreen = () => {
    setPlayerMode('compact');
    navigate('/library', { replace: true });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Music2 className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <Loader2 className="absolute -top-1 -right-1 w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Загрузка трека...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !track) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <Music2 className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Трек не найден</h2>
          <p className="text-muted-foreground text-sm">
            Возможно, трек был удалён или ссылка недействительна
          </p>
          <Button onClick={handleBack} variant="outline" className="mt-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            В библиотеку
          </Button>
        </div>
      </div>
    );
  }

  // Render fullscreen player
  return (
    <div className="fixed inset-0 z-50">
      <MobileFullscreenPlayer 
        track={track}
        onClose={handleCloseFullscreen}
      />
    </div>
  );
}
