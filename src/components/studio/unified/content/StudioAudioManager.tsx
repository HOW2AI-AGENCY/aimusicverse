/**
 * StudioAudioManager Component
 *
 * Manages audio engine, stem mixing, and playback state.
 * Extracted from UnifiedStudioContent for better maintainability.
 *
 * @feature Spec 001 - Phase 3: Component Maintainability
 * @priority P1 - Split UnifiedStudioContent (1477 lines → 5 components)
 */

import * as React from 'react';
import { useStemAudioEngine } from '@/hooks/studio/useStemAudioEngine';
import type { TrackStem } from '@/hooks/useStudioData';
import type { StemEffects } from '@/hooks/studio/types';

export interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

export interface StudioAudioManagerProps {
  trackId: string;
  stems: TrackStem[];
  onDurationChange: (duration: number) => void;
  onCurrentAudioUrlChange: (url: string | null) => void;
  onTimeUpdate: (time: number) => void;
  onEnded: () => void;
}

export interface StudioAudioManagerState {
  // Playback state
  duration: number;
  currentTime: number;
  volume: number;
  muted: boolean;
  masterVolume: number;
  masterMuted: boolean;
  currentAudioUrl: string | null;

  // Stem states
  stemStates: Record<string, StemState>;

  // Audio engine methods
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setMasterMuted: (muted: boolean) => void;
  setStemState: (stemId: string, state: Partial<StemState>) => void;
}

export function useStudioAudioManager({
  trackId,
  stems,
  onDurationChange,
  onCurrentAudioUrlChange,
  onTimeUpdate,
  onEnded,
}: StudioAudioManagerProps): StudioAudioManagerState {
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [volume, setVolume] = React.useState(0.85);
  const [muted, setMuted] = React.useState(false);
  const [masterVolume, setMasterVolume] = React.useState(0.85);
  const [masterMuted, setMasterMuted] = React.useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = React.useState<string | null>(null);
  const [stemStates, setStemStates] = React.useState<Record<string, StemState>>({});

  // Initialize stem states when stems change
  React.useEffect(() => {
    if (!stems || stems.length === 0) return;

    const newStates: Record<string, StemState> = {};
    stems.forEach(stem => {
      if (!newStates[stem.id]) {
        newStates[stem.id] = {
          muted: false,
          solo: false,
          volume: 0.85,
        };
      }
    });

    setStemStates(prev => ({ ...prev, ...newStates }));
  }, [stems]);

  // Audio engine hook
  const audioEngine = useStemAudioEngine({
    stems,
    stemStates,
    masterVolume,
    masterMuted,
    onDurationChange: (d) => {
      setDuration(d);
      onDurationChange(d);
    },
    onTimeUpdate: (t) => {
      setCurrentTime(t);
      onTimeUpdate(t);
    },
    onEnded,
  });

  // Update current audio URL when stems or active stem changes
  React.useEffect(() => {
    if (!stems || stems.length === 0) {
      setCurrentAudioUrl(null);
      onCurrentAudioUrlChange(null);
      return;
    }

    // Get the main audio URL (vocal stem or first available)
    const vocalStem = stems.find(s => s.stem_type === 'vocal');
    const audioUrl = vocalStem?.audio_url || stems[0]?.audio_url || null;

    setCurrentAudioUrl(audioUrl);
    onCurrentAudioUrlChange(audioUrl);
  }, [stems, onCurrentAudioUrlChange]);

  const play = React.useCallback(() => {
    // Implementation depends on audio engine
    audioEngine.play?.();
  }, [audioEngine]);

  const pause = React.useCallback(() => {
    audioEngine.pause?.();
  }, [audioEngine]);

  const seek = React.useCallback((time: number) => {
    audioEngine.seek?.(time);
    setCurrentTime(time);
  }, [audioEngine]);

  const handleSetVolume = React.useCallback((vol: number) => {
    setVolume(vol);
    // Update audio engine if needed
  }, []);

  const handleSetMuted = React.useCallback((m: boolean) => {
    setMuted(m);
    // Update audio engine if needed
  }, []);

  const handleSetMasterVolume = React.useCallback((vol: number) => {
    setMasterVolume(vol);
  }, []);

  const handleSetMasterMuted = React.useCallback((m: boolean) => {
    setMasterMuted(m);
  }, []);

  const setStemState = React.useCallback((stemId: string, state: Partial<StemState>) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: { ...prev[stemId], ...state },
    }));
  }, []);

  return {
    duration,
    currentTime,
    volume,
    muted,
    masterVolume,
    masterMuted,
    currentAudioUrl,
    stemStates,
    play,
    pause,
    seek,
    setVolume: handleSetVolume,
    setMuted: handleSetMuted,
    setMasterVolume: handleSetMasterVolume,
    setMasterMuted: handleSetMasterMuted,
    setStemState,
  };
}
