import { useRef, useCallback, useEffect, useState } from 'react';
import * as Tone from 'tone';
import { drumKits, getKitById, presetPatterns, type DrumKit, type DrumPattern, type DrumSound } from '@/lib/drum-kits';
import { logger } from '@/lib/logger';

export interface DrumMachineState {
  isReady: boolean;
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
  swing: number;
  volume: number;
  currentKit: DrumKit;
  pattern: Record<string, boolean[]>;
  soloTracks: Set<string>;
  mutedTracks: Set<string>;
}

interface UseDrumMachineReturn extends DrumMachineState {
  initialize: () => Promise<void>;
  play: () => void;
  stop: () => void;
  toggleStep: (soundId: string, step: number) => void;
  triggerSound: (soundId: string, velocity?: number) => void;
  setBpm: (bpm: number) => void;
  setSwing: (swing: number) => void;
  setVolume: (volume: number) => void;
  setKit: (kitId: string) => void;
  loadPattern: (pattern: DrumPattern) => void;
  clearPattern: () => void;
  toggleSolo: (soundId: string) => void;
  toggleMute: (soundId: string) => void;
  getAvailableKits: () => DrumKit[];
  getPresetPatterns: () => DrumPattern[];
}

// Create synth for drum sound
function createDrumSynth(sound: DrumSound): Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth | Tone.Synth {
  switch (sound.type) {
    case 'membrane':
      return new Tone.MembraneSynth(sound.params as unknown as Partial<Tone.MembraneSynthOptions>);
    case 'metal':
      return new Tone.MetalSynth(sound.params as unknown as Partial<Tone.MetalSynthOptions>);
    case 'noise':
      return new Tone.NoiseSynth(sound.params as unknown as Partial<Tone.NoiseSynthOptions>);
    case 'synth':
    default:
      return new Tone.Synth(sound.params as unknown as Partial<Tone.SynthOptions>);
  }
}

export function useDrumMachine(): UseDrumMachineReturn {
  const synthsRef = useRef<Map<string, Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth | Tone.Synth>>(new Map());
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const masterVolumeRef = useRef<Tone.Volume | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpmState] = useState(120);
  const [swing, setSwingState] = useState(0);
  const [volume, setVolumeState] = useState(-6);
  const [currentKit, setCurrentKit] = useState<DrumKit>(drumKits[0]);
  const [pattern, setPattern] = useState<Record<string, boolean[]>>({});
  const [soloTracks, setSoloTracks] = useState<Set<string>>(new Set());
  const [mutedTracks, setMutedTracks] = useState<Set<string>>(new Set());

  // Initialize empty pattern
  const initializePattern = useCallback((kit: DrumKit) => {
    const emptyPattern: Record<string, boolean[]> = {};
    kit.sounds.forEach(sound => {
      emptyPattern[sound.id] = Array(16).fill(false);
    });
    setPattern(emptyPattern);
  }, []);

  // Initialize synths for kit
  const initializeSynths = useCallback((kit: DrumKit) => {
    // Dispose old synths
    synthsRef.current.forEach(synth => synth.dispose());
    synthsRef.current.clear();

    // Create master volume if not exists
    if (!masterVolumeRef.current) {
      masterVolumeRef.current = new Tone.Volume(volume).toDestination();
    }

    // Create synths for each sound
    kit.sounds.forEach(sound => {
      const synth = createDrumSynth(sound);
      synth.connect(masterVolumeRef.current!);
      synthsRef.current.set(sound.id, synth);
    });
  }, [volume]);

  // Initialize Tone.js
  const initialize = useCallback(async () => {
    if (isReady) return;

    try {
      await Tone.start();
      Tone.getTransport().bpm.value = bpm;
      
      initializeSynths(currentKit);
      initializePattern(currentKit);
      
      setIsReady(true);
      logger.info('Drum machine initialized');
    } catch (err) {
      logger.error('Failed to initialize drum machine', err);
    }
  }, [isReady, bpm, currentKit, initializeSynths, initializePattern]);

  // Trigger a sound
  const triggerSound = useCallback((soundId: string, velocity = 1) => {
    const synth = synthsRef.current.get(soundId);
    if (!synth) return;

    // Check mute/solo
    const hasSolo = soloTracks.size > 0;
    if (hasSolo && !soloTracks.has(soundId)) return;
    if (mutedTracks.has(soundId)) return;

    try {
      if (synth instanceof Tone.NoiseSynth) {
        synth.triggerAttackRelease('16n', Tone.now(), velocity);
      } else if (synth instanceof Tone.MetalSynth) {
        synth.triggerAttackRelease('16n', Tone.now(), velocity);
      } else if (synth instanceof Tone.MembraneSynth) {
        synth.triggerAttackRelease('C1', '8n', Tone.now(), velocity);
      } else {
        synth.triggerAttackRelease('C4', '16n', Tone.now(), velocity);
      }
    } catch (err) {
      logger.error('Failed to trigger sound', err);
    }
  }, [soloTracks, mutedTracks]);

  // Create sequence
  const createSequence = useCallback(() => {
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }

    const steps = Array.from({ length: 16 }, (_, i) => i);
    
    sequenceRef.current = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step);
        
        // Trigger sounds for this step
        Object.entries(pattern).forEach(([soundId, stepPattern]) => {
          if (stepPattern[step]) {
            const synth = synthsRef.current.get(soundId);
            if (!synth) return;

            // Check mute/solo
            const hasSolo = soloTracks.size > 0;
            if (hasSolo && !soloTracks.has(soundId)) return;
            if (mutedTracks.has(soundId)) return;

            if (synth instanceof Tone.NoiseSynth) {
              synth.triggerAttackRelease('16n', time);
            } else if (synth instanceof Tone.MetalSynth) {
              synth.triggerAttackRelease('16n', time);
            } else if (synth instanceof Tone.MembraneSynth) {
              synth.triggerAttackRelease('C1', '8n', time);
            } else {
              synth.triggerAttackRelease('C4', '16n', time);
            }
          }
        });
      },
      steps,
      '16n'
    );
  }, [pattern, soloTracks, mutedTracks]);

  // Play
  const play = useCallback(() => {
    if (!isReady) return;
    
    createSequence();
    sequenceRef.current?.start(0);
    Tone.getTransport().start();
    setIsPlaying(true);
  }, [isReady, createSequence]);

  // Stop
  const stop = useCallback(() => {
    Tone.getTransport().stop();
    sequenceRef.current?.stop();
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  // Toggle step
  const toggleStep = useCallback((soundId: string, step: number) => {
    setPattern(prev => ({
      ...prev,
      [soundId]: prev[soundId]?.map((v, i) => i === step ? !v : v) || Array(16).fill(false)
    }));
  }, []);

  // Set BPM
  const setBpm = useCallback((newBpm: number) => {
    const clampedBpm = Math.max(40, Math.min(220, newBpm));
    setBpmState(clampedBpm);
    Tone.getTransport().bpm.value = clampedBpm;
  }, []);

  // Set Swing
  const setSwing = useCallback((newSwing: number) => {
    const clampedSwing = Math.max(0, Math.min(100, newSwing));
    setSwingState(clampedSwing);
    Tone.getTransport().swing = clampedSwing / 100;
  }, []);

  // Set Volume
  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (masterVolumeRef.current) {
      masterVolumeRef.current.volume.value = newVolume;
    }
  }, []);

  // Set Kit
  const setKit = useCallback((kitId: string) => {
    const kit = getKitById(kitId);
    if (!kit) return;
    
    const wasPlaying = isPlaying;
    if (wasPlaying) stop();
    
    setCurrentKit(kit);
    initializeSynths(kit);
    initializePattern(kit);
    
    if (wasPlaying) play();
  }, [isPlaying, stop, play, initializeSynths, initializePattern]);

  // Load Pattern
  const loadPattern = useCallback((presetPattern: DrumPattern) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) stop();
    
    setBpm(presetPattern.bpm);
    
    // Merge pattern with empty pattern for current kit
    const newPattern: Record<string, boolean[]> = {};
    currentKit.sounds.forEach(sound => {
      newPattern[sound.id] = presetPattern.steps[sound.id] || Array(16).fill(false);
    });
    setPattern(newPattern);
    
    if (wasPlaying) play();
  }, [isPlaying, stop, play, currentKit, setBpm]);

  // Clear Pattern
  const clearPattern = useCallback(() => {
    initializePattern(currentKit);
  }, [currentKit, initializePattern]);

  // Toggle Solo
  const toggleSolo = useCallback((soundId: string) => {
    setSoloTracks(prev => {
      const next = new Set(prev);
      if (next.has(soundId)) {
        next.delete(soundId);
      } else {
        next.add(soundId);
      }
      return next;
    });
  }, []);

  // Toggle Mute
  const toggleMute = useCallback((soundId: string) => {
    setMutedTracks(prev => {
      const next = new Set(prev);
      if (next.has(soundId)) {
        next.delete(soundId);
      } else {
        next.add(soundId);
      }
      return next;
    });
  }, []);

  // Recreate sequence when pattern changes
  useEffect(() => {
    if (isPlaying) {
      createSequence();
    }
  }, [pattern, isPlaying, createSequence]);

  // Cleanup
  useEffect(() => {
    return () => {
      sequenceRef.current?.dispose();
      synthsRef.current.forEach(synth => synth.dispose());
      masterVolumeRef.current?.dispose();
    };
  }, []);

  return {
    isReady,
    isPlaying,
    currentStep,
    bpm,
    swing,
    volume,
    currentKit,
    pattern,
    soloTracks,
    mutedTracks,
    initialize,
    play,
    stop,
    toggleStep,
    triggerSound,
    setBpm,
    setSwing,
    setVolume,
    setKit,
    loadPattern,
    clearPattern,
    toggleSolo,
    toggleMute,
    getAvailableKits: () => drumKits,
    getPresetPatterns: () => presetPatterns,
  };
}
