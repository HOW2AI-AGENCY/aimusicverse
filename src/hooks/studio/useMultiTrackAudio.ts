/**
 * Multi-track audio playback hook
 * Extracted from StemStudioContent for reusability
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface AudioSource {
  id: string;
  url: string;
}

interface TrackState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

export interface MultiTrackAudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  trackStates: Record<string, TrackState>;
}

export function useMultiTrackAudio(sources: AudioSource[]) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackStates, setTrackStates] = useState<Record<string, TrackState>>({});
  
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Initialize audio elements
  useEffect(() => {
    if (!sources.length) return;
    
    const initialStates: Record<string, TrackState> = {};
    let maxDuration = 0;

    sources.forEach(source => {
      initialStates[source.id] = { muted: false, solo: false, volume: 0.85 };

      if (!audioRefs.current[source.id]) {
        const audio = new Audio(source.url);
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        audioRefs.current[source.id] = audio;

        audio.addEventListener('loadedmetadata', () => {
          if (audio.duration > maxDuration) {
            maxDuration = audio.duration;
            setDuration(maxDuration);
          }
        });

        audio.addEventListener('ended', () => {
          const allEnded = Object.values(audioRefs.current).every(
            a => a.ended || a.currentTime >= a.duration - 0.1
          );
          if (allEnded) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        });

        audio.addEventListener('error', (e) => {
          logger.error(`Audio load error for ${source.id}`, e);
        });
      }
    });
    
    setTrackStates(prev => Object.keys(prev).length === 0 ? initialStates : prev);

    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current = {};
    };
  }, [sources]);

  const updateTime = useCallback(() => {
    const audios = Object.values(audioRefs.current);
    if (audios.length === 0) return;
    
    const avgTime = audios.reduce((sum, audio) => sum + audio.currentTime, 0) / audios.length;
    setCurrentTime(avgTime);
    
    const DRIFT_THRESHOLD = 0.1;
    const audioWithDrift = audios.map(audio => ({
      audio,
      drift: Math.abs(audio.currentTime - avgTime)
    }));
    
    const mostDrifted = audioWithDrift.reduce((max, current) => 
      current.drift > max.drift ? current : max
    );
    
    if (mostDrifted.drift > DRIFT_THRESHOLD) {
      mostDrifted.audio.currentTime = avgTime;
    }
    
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, []);

  const togglePlay = useCallback(async () => {
    const audios = Object.values(audioRefs.current);
    if (audios.length === 0) return;

    if (isPlaying) {
      audios.forEach(audio => audio.pause());
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPlaying(false);
    } else {
      audios.forEach(audio => {
        audio.currentTime = currentTime;
      });

      try {
        const playPromises = audios.map(audio => {
          if (audio.error) audio.load();
          return audio.play();
        });
        
        await Promise.all(playPromises);
        setIsPlaying(true);
        animationFrameRef.current = requestAnimationFrame(updateTime);
      } catch (error) {
        logger.error('Error playing audio', error);
        audios.forEach(audio => audio.pause());
        setIsPlaying(false);
        throw error;
      }
    }
  }, [isPlaying, currentTime, updateTime]);

  const seek = useCallback((time: number) => {
    const audios = Object.values(audioRefs.current);
    const wasPlaying = isPlaying;
    
    if (wasPlaying) {
      audios.forEach(audio => audio.pause());
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    
    setCurrentTime(time);
    audios.forEach(audio => {
      audio.currentTime = time;
    });
    
    if (wasPlaying) {
      Promise.all(audios.map(audio => audio.play()))
        .then(() => {
          setIsPlaying(true);
          animationFrameRef.current = requestAnimationFrame(updateTime);
        })
        .catch(error => {
          logger.error('Error resuming after seek', error);
          setIsPlaying(false);
        });
    }
  }, [isPlaying, updateTime]);

  const skip = useCallback((direction: 'back' | 'forward', amount = 10) => {
    const newTime = direction === 'back' 
      ? Math.max(0, currentTime - amount)
      : Math.min(duration, currentTime + amount);
    seek(newTime);
  }, [currentTime, duration, seek]);

  const toggleMute = useCallback((trackId: string) => {
    setTrackStates(prev => ({
      ...prev,
      [trackId]: { ...prev[trackId], muted: !prev[trackId]?.muted }
    }));
  }, []);

  const toggleSolo = useCallback((trackId: string) => {
    setTrackStates(prev => {
      const newStates = { ...prev };
      const wasSolo = prev[trackId]?.solo;
      newStates[trackId] = { ...newStates[trackId], solo: !wasSolo };
      
      if (!wasSolo) {
        Object.keys(newStates).forEach(id => {
          if (id !== trackId) {
            newStates[id] = { ...newStates[id], solo: false };
          }
        });
      }
      
      return newStates;
    });
  }, []);

  const setVolume = useCallback((trackId: string, volume: number) => {
    setTrackStates(prev => ({
      ...prev,
      [trackId]: { ...prev[trackId], volume }
    }));
  }, []);

  const getAudioElement = useCallback((trackId: string) => {
    return audioRefs.current[trackId];
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    trackStates,
    togglePlay,
    seek,
    skip,
    toggleMute,
    toggleSolo,
    setVolume,
    setTrackStates,
    getAudioElement,
  };
}
