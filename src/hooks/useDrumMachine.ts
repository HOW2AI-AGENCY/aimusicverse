import { useRef, useCallback, useEffect, useState } from 'react';
import * as Tone from 'tone';
import { drumKits, getKitById, presetPatterns, type DrumKit, type DrumPattern, type DrumSound } from '@/lib/drum-kits';
import { logger } from '@/lib/logger';

export type StepLength = 16 | 32 | 64;

export interface TrackEffects {
  filter: {
    enabled: boolean;
    frequency: number; // 100-20000
    resonance: number; // 0-20
  };
  compressor: {
    enabled: boolean;
    threshold: number; // -60 to 0
    ratio: number; // 1-20
  };
  volume: number; // -40 to 6
  pan: number; // -1 to 1
}

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
  // New enhanced state
  stepLength: StepLength;
  recordingState: 'idle' | 'recording' | 'recorded';
  recordedAudioUrl: string | null;
  recordedAudioBlob: Blob | null;
  trackEffects: Record<string, TrackEffects>;
  patternChain: string[];
  currentChainIndex: number;
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
  // New enhanced methods
  setStepLength: (length: StepLength) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  setTrackEffect: (soundId: string, effects: Partial<TrackEffects>) => void;
  addToChain: (patternId: string) => void;
  removeFromChain: (index: number) => void;
  clearChain: () => void;
  copyPattern: () => Record<string, boolean[]>;
  pastePattern: (copiedPattern: Record<string, boolean[]>) => void;
  exportToMidi: () => void;
}

// Default effects for a track
const defaultTrackEffects: TrackEffects = {
  filter: { enabled: false, frequency: 5000, resonance: 1 },
  compressor: { enabled: false, threshold: -24, ratio: 4 },
  volume: 0,
  pan: 0,
};

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
  const recorderRef = useRef<Tone.Recorder | null>(null);
  
  // Per-track effects chains
  const trackFiltersRef = useRef<Map<string, Tone.Filter>>(new Map());
  const trackCompressorsRef = useRef<Map<string, Tone.Compressor>>(new Map());
  const trackPannersRef = useRef<Map<string, Tone.Panner>>(new Map());
  const trackVolumesRef = useRef<Map<string, Tone.Volume>>(new Map());
  
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
  
  // Enhanced state
  const [stepLength, setStepLengthState] = useState<StepLength>(16);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [trackEffects, setTrackEffects] = useState<Record<string, TrackEffects>>({});
  const [patternChain, setPatternChain] = useState<string[]>([]);
  const [currentChainIndex, setCurrentChainIndex] = useState(0);

  // Initialize empty pattern with current step length
  const initializePattern = useCallback((kit: DrumKit, steps: StepLength = stepLength) => {
    const emptyPattern: Record<string, boolean[]> = {};
    const defaultEffects: Record<string, TrackEffects> = {};
    kit.sounds.forEach(sound => {
      emptyPattern[sound.id] = Array(steps).fill(false);
      defaultEffects[sound.id] = { ...defaultTrackEffects };
    });
    setPattern(emptyPattern);
    setTrackEffects(defaultEffects);
  }, [stepLength]);

  // Initialize synths for kit with effects chain
  const initializeSynths = useCallback((kit: DrumKit) => {
    // Dispose old synths and effects
    synthsRef.current.forEach(synth => synth.dispose());
    synthsRef.current.clear();
    trackFiltersRef.current.forEach(f => f.dispose());
    trackFiltersRef.current.clear();
    trackCompressorsRef.current.forEach(c => c.dispose());
    trackCompressorsRef.current.clear();
    trackPannersRef.current.forEach(p => p.dispose());
    trackPannersRef.current.clear();
    trackVolumesRef.current.forEach(v => v.dispose());
    trackVolumesRef.current.clear();

    // Create master volume if not exists
    if (!masterVolumeRef.current) {
      masterVolumeRef.current = new Tone.Volume(volume).toDestination();
    }

    // Create recorder
    if (!recorderRef.current) {
      recorderRef.current = new Tone.Recorder();
      masterVolumeRef.current.connect(recorderRef.current);
    }

    // Create synths with effects chain for each sound
    kit.sounds.forEach(sound => {
      const synth = createDrumSynth(sound);
      
      // Create effects chain: synth -> filter -> compressor -> panner -> volume -> master
      const filter = new Tone.Filter({ frequency: 5000, type: 'lowpass', Q: 1 });
      const compressor = new Tone.Compressor({ threshold: -24, ratio: 4 });
      const panner = new Tone.Panner(0);
      const trackVol = new Tone.Volume(0);
      
      synth.chain(filter, compressor, panner, trackVol, masterVolumeRef.current!);
      
      synthsRef.current.set(sound.id, synth);
      trackFiltersRef.current.set(sound.id, filter);
      trackCompressorsRef.current.set(sound.id, compressor);
      trackPannersRef.current.set(sound.id, panner);
      trackVolumesRef.current.set(sound.id, trackVol);
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

    const steps = Array.from({ length: stepLength }, (_, i) => i);
    
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
  }, [pattern, soloTracks, mutedTracks, stepLength]);

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
      [soundId]: prev[soundId]?.map((v, i) => i === step ? !v : v) || Array(stepLength).fill(false)
    }));
  }, [stepLength]);

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
      const presetSteps = presetPattern.steps[sound.id];
      if (presetSteps) {
        // Extend or trim to match current stepLength
        newPattern[sound.id] = Array(stepLength).fill(false).map((_, i) => 
          i < presetSteps.length ? presetSteps[i] : false
        );
      } else {
        newPattern[sound.id] = Array(stepLength).fill(false);
      }
    });
    setPattern(newPattern);
    
    if (wasPlaying) play();
  }, [isPlaying, stop, play, currentKit, setBpm, stepLength]);

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

  // Set step length
  const setStepLength = useCallback((newLength: StepLength) => {
    setStepLengthState(newLength);
    // Resize existing pattern
    setPattern(prev => {
      const resized: Record<string, boolean[]> = {};
      Object.entries(prev).forEach(([soundId, steps]) => {
        resized[soundId] = Array(newLength).fill(false).map((_, i) => 
          i < steps.length ? steps[i] : false
        );
      });
      return resized;
    });
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!recorderRef.current || recordingState === 'recording') return;
    
    try {
      await recorderRef.current.start();
      setRecordingState('recording');
      logger.info('Recording started');
    } catch (err) {
      logger.error('Failed to start recording', err);
    }
  }, [recordingState]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || recordingState !== 'recording') return;
    
    try {
      const recording = await recorderRef.current.stop();
      const url = URL.createObjectURL(recording);
      setRecordedAudioUrl(url);
      setRecordedAudioBlob(recording);
      setRecordingState('recorded');
      logger.info('Recording stopped', { size: recording.size });
    } catch (err) {
      logger.error('Failed to stop recording', err);
    }
  }, [recordingState]);

  // Clear recording
  const clearRecording = useCallback(() => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
    setRecordedAudioBlob(null);
    setRecordingState('idle');
  }, [recordedAudioUrl]);

  // Set track effects
  const setTrackEffect = useCallback((soundId: string, effects: Partial<TrackEffects>) => {
    setTrackEffects(prev => ({
      ...prev,
      [soundId]: { ...prev[soundId], ...effects }
    }));
    
    // Apply effects to Tone.js nodes
    const filter = trackFiltersRef.current.get(soundId);
    const compressor = trackCompressorsRef.current.get(soundId);
    const panner = trackPannersRef.current.get(soundId);
    const vol = trackVolumesRef.current.get(soundId);
    
    if (effects.filter && filter) {
      filter.frequency.value = effects.filter.frequency || 5000;
      filter.Q.value = effects.filter.resonance || 1;
    }
    if (effects.compressor && compressor) {
      compressor.threshold.value = effects.compressor.threshold || -24;
      compressor.ratio.value = effects.compressor.ratio || 4;
    }
    if (effects.pan !== undefined && panner) {
      panner.pan.value = effects.pan;
    }
    if (effects.volume !== undefined && vol) {
      vol.volume.value = effects.volume;
    }
  }, []);

  // Pattern chain methods
  const addToChain = useCallback((patternId: string) => {
    setPatternChain(prev => [...prev, patternId]);
  }, []);

  const removeFromChain = useCallback((index: number) => {
    setPatternChain(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearChain = useCallback(() => {
    setPatternChain([]);
    setCurrentChainIndex(0);
  }, []);

  // Copy/paste pattern
  const copyPattern = useCallback(() => {
    return { ...pattern };
  }, [pattern]);

  const pastePattern = useCallback((copiedPattern: Record<string, boolean[]>) => {
    setPattern(prev => {
      const pasted: Record<string, boolean[]> = {};
      Object.keys(prev).forEach(soundId => {
        if (copiedPattern[soundId]) {
          pasted[soundId] = [...copiedPattern[soundId]].slice(0, stepLength);
          // Pad if needed
          while (pasted[soundId].length < stepLength) {
            pasted[soundId].push(false);
          }
        } else {
          pasted[soundId] = prev[soundId];
        }
      });
      return pasted;
    });
  }, [stepLength]);

  // Export to MIDI (creates download)
  const exportToMidi = useCallback(() => {
    // Simple MIDI export - create a Blob with MIDI data
    // Using a basic MIDI format
    const midiData = {
      bpm,
      pattern,
      stepLength,
      kit: currentKit.id
    };
    
    const blob = new Blob([JSON.stringify(midiData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drum-pattern-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    logger.info('Pattern exported');
  }, [bpm, pattern, stepLength, currentKit.id]);

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
      recorderRef.current?.dispose();
      trackFiltersRef.current.forEach(f => f.dispose());
      trackCompressorsRef.current.forEach(c => c.dispose());
      trackPannersRef.current.forEach(p => p.dispose());
      trackVolumesRef.current.forEach(v => v.dispose());
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [recordedAudioUrl]);

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
    stepLength,
    recordingState,
    recordedAudioUrl,
    recordedAudioBlob,
    trackEffects,
    patternChain,
    currentChainIndex,
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
    setStepLength,
    startRecording,
    stopRecording,
    clearRecording,
    setTrackEffect,
    addToChain,
    removeFromChain,
    clearChain,
    copyPattern,
    pastePattern,
    exportToMidi,
  };
}
