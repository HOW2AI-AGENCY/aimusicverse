import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface UseWaveformOptions {
  audioUrl: string;
  container: HTMLElement | null;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  barWidth?: number;
  barGap?: number;
  barRadius?: number;
  cursorWidth?: number;
  normalize?: boolean;
}

interface UseWaveformReturn {
  wavesurfer: WaveSurfer | null;
  isReady: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  seek: (time: number) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

export const useWaveform = ({
  audioUrl,
  container,
  height = 48,
  waveColor = 'rgba(255, 255, 255, 0.3)',
  progressColor = 'rgba(255, 255, 255, 0.6)',
  barWidth = 2,
  barGap = 1,
  barRadius = 2,
  cursorWidth = 0,
  normalize = true,
}: UseWaveformOptions): UseWaveformReturn => {
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!container || !audioUrl) return;

    setIsLoading(true);
    setIsReady(false);

    const wavesurfer = WaveSurfer.create({
      container,
      height,
      waveColor,
      progressColor,
      barWidth,
      barGap,
      barRadius,
      cursorWidth,
      normalize,
      backend: 'WebAudio',
      interact: false, // We handle interaction externally
      hideScrollbar: true,
      fillParent: true,
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.on('ready', () => {
      setIsReady(true);
      setIsLoading(false);
      setDuration(wavesurfer.getDuration());
    });

    wavesurfer.on('error', (err) => {
      console.error('Waveform error:', err);
      setIsLoading(false);
    });

    wavesurfer.on('timeupdate', (time) => {
      setCurrentTime(time);
    });

    wavesurfer.load(audioUrl);

    return () => {
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [audioUrl, container, height, waveColor, progressColor, barWidth, barGap, barRadius, cursorWidth, normalize]);

  const seek = useCallback((time: number) => {
    if (wavesurferRef.current && isReady) {
      const progress = time / wavesurferRef.current.getDuration();
      wavesurferRef.current.seekTo(Math.max(0, Math.min(1, progress)));
    }
  }, [isReady]);

  const setMuted = useCallback((muted: boolean) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setMuted(muted);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume);
    }
  }, []);

  return {
    wavesurfer: wavesurferRef.current,
    isReady,
    isLoading,
    duration,
    currentTime,
    seek,
    setMuted,
    setVolume,
  };
};
