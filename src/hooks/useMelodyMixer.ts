/**
 * Hook for Melody Mixer - DJ-style interface for creating melodies
 * Blends multiple musical styles with weighted control
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { useHapticFeedback } from './useHapticFeedback';
import { logger } from '@/lib/logger';

export interface StyleSlot {
  id: string;
  name: string;
  color: string;
  weight: number;
  enabled: boolean;
}

export interface MelodyMixerState {
  slots: StyleSlot[];
  bpm: number;
  key: string;
  scale: 'major' | 'minor' | 'pentatonic' | 'blues';
  isPlaying: boolean;
  isRecording: boolean;
  recordedAudioUrl: string | null;
}

interface UseMelodyMixerOptions {
  onRecordingComplete?: (audioUrl: string) => void;
}

// Default style slots
const DEFAULT_SLOTS: StyleSlot[] = [
  { id: '1', name: 'Acoustic Guitar', color: 'hsl(30, 80%, 60%)', weight: 0.7, enabled: true },
  { id: '2', name: 'Electric Clean', color: 'hsl(200, 80%, 60%)', weight: 0.3, enabled: true },
  { id: '3', name: 'Fingerpicking', color: 'hsl(160, 70%, 50%)', weight: 0.5, enabled: true },
  { id: '4', name: 'Bossa Nova', color: 'hsl(280, 70%, 60%)', weight: 0.2, enabled: false },
  { id: '5', name: 'Folk Strum', color: 'hsl(45, 90%, 55%)', weight: 0, enabled: false },
  { id: '6', name: 'Jazz Chord', color: 'hsl(320, 60%, 50%)', weight: 0, enabled: false },
  { id: '7', name: 'Blues Lick', color: 'hsl(220, 70%, 55%)', weight: 0, enabled: false },
  { id: '8', name: 'Arpeggios', color: 'hsl(140, 65%, 45%)', weight: 0, enabled: false },
];

// Scale patterns (semitones from root)
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
};

// Key to MIDI note mapping (octave 4)
const KEY_TO_MIDI: Record<string, number> = {
  'C': 60, 'C#': 61, 'D': 62, 'D#': 63, 'E': 64, 'F': 65,
  'F#': 66, 'G': 67, 'G#': 68, 'A': 69, 'A#': 70, 'B': 71,
};

export function useMelodyMixer(options: UseMelodyMixerOptions = {}) {
  const { onRecordingComplete } = options;
  const haptic = useHapticFeedback();

  const [state, setState] = useState<MelodyMixerState>({
    slots: DEFAULT_SLOTS,
    bpm: 120,
    key: 'C',
    scale: 'major',
    isPlaying: false,
    isRecording: false,
    recordedAudioUrl: null,
  });

  // Audio refs
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const recorderRef = useRef<Tone.Recorder | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const patternIndexRef = useRef(0);

  /**
   * Initialize audio
   */
  const initialize = useCallback(async () => {
    await Tone.start();

    // Create polyphonic synth with guitar-like sound
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle8',
      },
      envelope: {
        attack: 0.005,
        decay: 0.2,
        sustain: 0.4,
        release: 0.8,
      },
    }).toDestination();

    synthRef.current = synth;

    // Create recorder
    const recorder = new Tone.Recorder();
    synth.connect(recorder);
    recorderRef.current = recorder;

    logger.info('Melody mixer initialized');
  }, []);

  /**
   * Generate notes based on weighted styles
   */
  const generatePattern = useCallback(() => {
    const { slots, key, scale } = state;
    const activeSlots = slots.filter(s => s.enabled && s.weight > 0);
    
    if (activeSlots.length === 0) return [];

    const rootMidi = KEY_TO_MIDI[key] || 60;
    const scaleNotes = SCALES[scale];
    
    // Generate pattern based on weighted styles
    const pattern: number[][] = [];
    const patternLength = 16; // 16th notes in a bar

    for (let i = 0; i < patternLength; i++) {
      const notesAtStep: number[] = [];
      
      activeSlots.forEach(slot => {
        // Use weight as probability of playing a note
        if (Math.random() < slot.weight * 0.6) {
          // Pick a random scale degree
          const degree = Math.floor(Math.random() * scaleNotes.length);
          const octaveOffset = Math.floor(Math.random() * 2) * 12 - 12;
          const midiNote = rootMidi + scaleNotes[degree] + octaveOffset;
          notesAtStep.push(midiNote);
        }
      });

      pattern.push(notesAtStep);
    }

    return pattern;
  }, [state]);

  /**
   * Start playing
   */
  const startPlaying = useCallback(async () => {
    if (!synthRef.current) {
      await initialize();
    }

    Tone.Transport.bpm.value = state.bpm;
    
    const pattern = generatePattern();
    
    // Create sequence
    const sequence = new Tone.Sequence(
      (time, notes) => {
        if (notes && Array.isArray(notes) && notes.length > 0 && synthRef.current) {
          (notes as number[]).forEach((note: number) => {
            const noteName = Tone.Frequency(note, 'midi').toNote();
            synthRef.current?.triggerAttackRelease(noteName, '16n', time, 0.7);
          });
        }
        patternIndexRef.current = (patternIndexRef.current + 1) % pattern.length;
      },
      pattern,
      '16n'
    );

    sequence.start(0);
    sequenceRef.current = sequence;
    
    Tone.Transport.start();
    setState(prev => ({ ...prev, isPlaying: true }));
    haptic.success();
    
    logger.info('Melody mixer playback started');
  }, [state.bpm, generatePattern, initialize, haptic]);

  /**
   * Stop playing
   */
  const stopPlaying = useCallback(() => {
    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }

    Tone.Transport.stop();
    synthRef.current?.releaseAll();
    patternIndexRef.current = 0;
    
    setState(prev => ({ ...prev, isPlaying: false }));
    haptic.tap();
    
    logger.info('Melody mixer playback stopped');
  }, [haptic]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    if (!recorderRef.current) {
      await initialize();
    }

    recorderRef.current?.start();
    setState(prev => ({ ...prev, isRecording: true }));
    
    if (!state.isPlaying) {
      await startPlaying();
    }
    
    haptic.impact('medium');
    logger.info('Melody mixer recording started');
  }, [state.isPlaying, startPlaying, initialize, haptic]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    const recording = await recorderRef.current.stop();
    const url = URL.createObjectURL(recording);
    
    setState(prev => ({
      ...prev,
      isRecording: false,
      recordedAudioUrl: url,
    }));

    stopPlaying();
    onRecordingComplete?.(url);
    haptic.success();
    
    logger.info('Melody mixer recording complete');
  }, [stopPlaying, onRecordingComplete, haptic]);

  /**
   * Update slot weight
   */
  const updateSlotWeight = useCallback((id: string, weight: number) => {
    setState(prev => ({
      ...prev,
      slots: prev.slots.map(slot =>
        slot.id === id ? { ...slot, weight: Math.max(0, Math.min(1, weight)) } : slot
      ),
    }));
  }, []);

  /**
   * Toggle slot enabled
   */
  const toggleSlot = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      slots: prev.slots.map(slot =>
        slot.id === id ? { ...slot, enabled: !slot.enabled } : slot
      ),
    }));
    haptic.tap();
  }, [haptic]);

  /**
   * Update slot name
   */
  const updateSlotName = useCallback((id: string, name: string) => {
    setState(prev => ({
      ...prev,
      slots: prev.slots.map(slot =>
        slot.id === id ? { ...slot, name } : slot
      ),
    }));
  }, []);

  /**
   * Set BPM
   */
  const setBpm = useCallback((bpm: number) => {
    setState(prev => ({ ...prev, bpm: Math.max(40, Math.min(240, bpm)) }));
    Tone.Transport.bpm.value = bpm;
  }, []);

  /**
   * Set key
   */
  const setKey = useCallback((key: string) => {
    setState(prev => ({ ...prev, key }));
  }, []);

  /**
   * Set scale
   */
  const setScale = useCallback((scale: MelodyMixerState['scale']) => {
    setState(prev => ({ ...prev, scale }));
  }, []);

  /**
   * Clear recording
   */
  const clearRecording = useCallback(() => {
    if (state.recordedAudioUrl) {
      URL.revokeObjectURL(state.recordedAudioUrl);
    }
    setState(prev => ({ ...prev, recordedAudioUrl: null }));
  }, [state.recordedAudioUrl]);

  /**
   * Get active style descriptions for prompt
   */
  const getStylePrompt = useCallback(() => {
    const activeSlots = state.slots
      .filter(s => s.enabled && s.weight > 0)
      .sort((a, b) => b.weight - a.weight);

    if (activeSlots.length === 0) return '';

    return activeSlots
      .map(s => `${s.name} (${Math.round(s.weight * 100)}%)`)
      .join(', ');
  }, [state.slots]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sequenceRef.current?.dispose();
      synthRef.current?.dispose();
      recorderRef.current?.dispose();
      if (state.recordedAudioUrl) {
        URL.revokeObjectURL(state.recordedAudioUrl);
      }
    };
  }, []);

  return {
    ...state,
    initialize,
    startPlaying,
    stopPlaying,
    startRecording,
    stopRecording,
    updateSlotWeight,
    toggleSlot,
    updateSlotName,
    setBpm,
    setKey,
    setScale,
    clearRecording,
    getStylePrompt,
  };
}
