/**
 * useLibraryHandlers - Consolidated handlers for Library page
 * 
 * Extracts all callback handlers to reduce Library.tsx complexity
 * 
 * @module hooks/useLibraryHandlers
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import type { Track } from "@/hooks/useTracks";
import { logger } from "@/lib/logger";

const log = logger.child({ module: 'useLibraryHandlers' });

interface UseLibraryHandlersOptions {
  filteredTracks: Track[];
  logPlay: (trackId: string) => void;
}

export function useLibraryHandlers({ 
  filteredTracks,
  logPlay,
}: UseLibraryHandlersOptions) {
  const navigate = useNavigate();
  const { activeTrack, playTrack, queue } = usePlayerStore();

  // Play a single track
  const handlePlay = useCallback((track: Track, index?: number) => {
    if (!track.audio_url) return;
    
    const completedTracks = filteredTracks.filter(t => t.audio_url && t.status === 'completed');
    const trackIndex = index !== undefined ? index : completedTracks.findIndex(t => t.id === track.id);
    
    if (queue.length === 0 || activeTrack?.id !== track.id) {
      usePlayerStore.setState({
        queue: completedTracks,
        currentIndex: trackIndex >= 0 ? trackIndex : 0,
        activeTrack: track,
        isPlaying: true,
        playerMode: 'compact',
      });
    } else {
      playTrack(track);
    }
    
    logPlay(track.id);
  }, [filteredTracks, queue.length, activeTrack?.id, playTrack, logPlay]);

  // Play all tracks
  const handlePlayAll = useCallback(() => {
    const completedTracks = filteredTracks.filter(t => t.audio_url && t.status === 'completed');
    if (completedTracks.length === 0) return;
    
    usePlayerStore.setState({
      queue: completedTracks,
      currentIndex: 0,
      activeTrack: completedTracks[0],
      isPlaying: true,
      playerMode: 'compact',
    });
  }, [filteredTracks]);

  // Shuffle all tracks
  const handleShuffleAll = useCallback(() => {
    const completedTracks = filteredTracks.filter(t => t.audio_url && t.status === 'completed');
    if (completedTracks.length === 0) return;
    
    const shuffled = [...completedTracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    usePlayerStore.setState({
      queue: shuffled,
      currentIndex: 0,
      activeTrack: shuffled[0],
      isPlaying: true,
      shuffle: true,
      playerMode: 'compact',
    });
  }, [filteredTracks]);

  // Download track
  const handleDownload = useCallback((trackId: string, audioUrl: string | null, coverUrl: string | null) => {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `track-${trackId}.mp3`;
    link.click();
  }, []);

  // Handle tag click - navigate to community search
  const handleTagClick = useCallback((tag: string) => {
    log.info('Tag clicked, navigating to community', { tag });
    navigate(`/community?tag=${encodeURIComponent(tag)}`);
  }, [navigate]);

  return {
    handlePlay,
    handlePlayAll,
    handleShuffleAll,
    handleDownload,
    handleTagClick,
    activeTrackId: activeTrack?.id,
  };
}
