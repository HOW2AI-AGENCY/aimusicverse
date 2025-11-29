import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAudioPlayerProps {
  trackId: string;
  streamingUrl?: string | null;
  localAudioUrl?: string | null;
  audioUrl?: string | null;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export const useAudioPlayer = ({
  trackId,
  streamingUrl,
  localAudioUrl,
  audioUrl,
  onPlay,
  onPause,
  onEnded,
}: UseAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Prioritize audio sources
  const audioSource = streamingUrl || localAudioUrl || audioUrl;

  useEffect(() => {
    if (!audioSource) return;

    // Create or update audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }

    const audio = audioRef.current;

    // Set source with priority
    audio.src = audioSource;

    // Event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        setBuffered((bufferedEnd / audio.duration) * 100);
      }
    };

    const handleCanPlay = () => {
      setLoading(false);
    };

    const handleWaiting = () => {
      setLoading(true);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    const handleError = (e: ErrorEvent) => {
      console.error('Audio playback error:', e);
      setLoading(false);
      setIsPlaying(false);
      
      // Try fallback sources
      if (audio.src === streamingUrl && localAudioUrl) {
        console.log('Streaming failed, trying local source');
        audio.src = localAudioUrl;
        audio.load();
      } else if (audio.src === localAudioUrl && audioUrl && audioUrl !== localAudioUrl) {
        console.log('Local source failed, trying original URL');
        audio.src = audioUrl;
        audio.load();
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as any);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as any);
    };
  }, [audioSource, streamingUrl, localAudioUrl, audioUrl, onPlay, onPause, onEnded]);

  const play = useCallback(async () => {
    if (!audioRef.current || !audioSource) return;
    
    try {
      setLoading(true);
      await audioRef.current.play();
    } catch (error) {
      console.error('Play error:', error);
      setLoading(false);
    }
  }, [audioSource]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = Math.max(0, Math.min(1, volume));
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    buffered,
    loading,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    audioSource,
  };
};