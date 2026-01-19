/**
 * Studio Audio Setup Hook
 * Manages audio engine setup, playback coordination, and track conversion
 * Extracted from StudioShell to reduce complexity
 * 
 * @module components/studio/unified/StudioShell/useStudioAudioSetup
 */

import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useStudioAudioEngine, AudioTrack } from '@/hooks/studio/useStudioAudioEngine';
import { useMobileAudioFallback } from '@/hooks/studio/useMobileAudioFallback';
import { useStudioOptimizations } from '@/hooks/studio/useStudioOptimizations';
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from '@/hooks/studio/useStudioAudio';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';
import type { TrackStem } from '@/hooks/useTrackStems';

interface UseStudioAudioSetupOptions {
  project: {
    id: string;
    tracks: StudioTrack[];
    masterVolume: number;
    durationSeconds?: number;
  } | null;
  isMobile: boolean;
  seek: (time: number) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  play: () => void;
  pause: () => void;
  isPlaying: boolean;
}

export function useStudioAudioSetup({
  project,
  isMobile,
  seek,
  setTrackVolume,
  setMasterVolume,
  play,
  pause,
  isPlaying,
}: UseStudioAudioSetupOptions) {
  const { pauseTrack: pauseGlobalPlayer } = usePlayerStore();
  const isMountedRef = useRef(false);

  // Convert store tracks to AudioTrack format for engine
  // IMPORTANT: When stems exist, use ONLY stems for playback (exclude main track)
  const audioTracks = useMemo((): AudioTrack[] => {
    if (!project) return [];
    
    const stemTypes = ['vocal', 'instrumental', 'drums', 'bass', 'other'];
    const readyTracks = project.tracks.filter(t => t.status !== 'pending' && t.status !== 'failed');
    const stems = readyTracks.filter(t => stemTypes.includes(t.type));
    
    // If stems exist, playback ONLY stems (exclude main track)
    const tracksToUse = stems.length > 0 
      ? stems 
      : readyTracks;
    
    return tracksToUse.map(track => {
      // Get audio URL from track or active version
      let audioUrl = track.audioUrl;
      if (!audioUrl && track.versions?.length) {
        const activeVersion = track.versions.find(v => v.label === track.activeVersionLabel);
        audioUrl = activeVersion?.audioUrl || track.versions[0]?.audioUrl;
      }
      if (!audioUrl && track.clips?.[0]?.audioUrl) {
        audioUrl = track.clips[0].audioUrl;
      }
      
      return {
        id: track.id,
        audioUrl,
        volume: track.volume,
        muted: track.muted,
        solo: track.solo,
      };
    });
  }, [project?.tracks]);

  // Convert tracks to TrackStem format for mobile fallback detection
  const tracksAsStems = useMemo((): TrackStem[] => {
    if (!project) return [];
    return project.tracks
      .filter(t => t.status !== 'pending' && t.status !== 'failed')
      .map(track => ({
        id: track.id,
        track_id: project.id,
        stem_type: track.type,
        audio_url: track.audioUrl || '',
        separation_mode: null,
        version_id: null,
        created_at: new Date().toISOString(),
      }));
  }, [project?.tracks, project?.id]);

  // Mobile audio fallback handling
  const mobileAudioFallback = useMobileAudioFallback({
    stems: tracksAsStems,
    enabled: isMobile,
  });

  // Studio optimizations (caching, offline support, debounced controls)
  const studioOptimizations = useStudioOptimizations({
    stems: tracksAsStems,
    audioRefs: {},
    onTimeUpdate: seek,
    onStemVolumeChange: (stemId, volume) => setTrackVolume(stemId, volume),
    onMasterVolumeChange: setMasterVolume,
    onSeek: seek,
  });

  // Multi-track audio engine
  const audioEngine = useStudioAudioEngine({
    tracks: audioTracks,
    masterVolume: project?.masterVolume ?? 0.85,
    onTimeUpdate: seek,
    onDurationChange: undefined,
    onEnded: () => {
      pause();
      seek(0);
    },
  });

  // Get main audio URL for waveform visualization
  const mainAudioUrl = project?.tracks[0]?.audioUrl || project?.tracks[0]?.clips?.[0]?.audioUrl;
  const duration = audioEngine.duration || project?.durationSeconds || 180;

  // Sync playback state with store
  useEffect(() => {
    if (isPlaying && !audioEngine.isPlaying) {
      audioEngine.play();
    } else if (!isPlaying && audioEngine.isPlaying) {
      audioEngine.pause();
    }
  }, [isPlaying, audioEngine]);

  // Sync seek with audio engine
  const handleSeek = useCallback((time: number) => {
    audioEngine.seek(time);
    seek(time);
  }, [audioEngine, seek]);

  // Handle play/pause with global audio coordination
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
      pause();
    } else {
      // Pause global player and other studio sources before playing
      pauseGlobalPlayer();
      pauseAllStudioAudio('studio-shell');
      audioEngine.play();
      play();
    }
  }, [isPlaying, play, pause, audioEngine, pauseGlobalPlayer]);

  // Track component mount state for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Register studio audio for global coordination
  useEffect(() => {
    registerStudioAudio('studio-shell', () => {
      audioEngine.pause();
      pause();
    });
    return () => {
      unregisterStudioAudio('studio-shell');
    };
  }, [audioEngine, pause]);

  // Update track volumes in engine when they change
  useEffect(() => {
    if (!project) return;
    project.tracks.forEach(track => {
      audioEngine.setTrackVolume(track.id, track.volume);
    });
  }, [project?.tracks, audioEngine]);

  return {
    audioEngine,
    audioTracks,
    tracksAsStems,
    mainAudioUrl,
    duration,
    mobileAudioFallback,
    studioOptimizations,
    handleSeek,
    handlePlayPause,
    isMountedRef,
  };
}
