/**
 * usePromptDJEnhanced - Enhanced PromptDJ hook with buffering, caching, and 8 channels
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import * as Tone from 'tone';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PromptChannel {
  id: string;
  type: string;
  value: string;
  weight: number; // 0-1
  enabled: boolean;
}

export interface GlobalSettings {
  bpm: number;
  key: string;
  scale: string;
  density: number;
  brightness: number;
  duration: number;
}

export interface GeneratedTrack {
  id: string;
  prompt: string;
  audioUrl: string;
  createdAt: Date;
}

// Default 8 channels
const DEFAULT_CHANNELS: PromptChannel[] = [
  { id: 'genre', type: 'genre', value: '', weight: 0.5, enabled: true },
  { id: 'instrument1', type: 'instrument1', value: '', weight: 0.5, enabled: true },
  { id: 'instrument2', type: 'instrument2', value: '', weight: 0.3, enabled: false },
  { id: 'mood', type: 'mood', value: '', weight: 0.5, enabled: true },
  { id: 'texture', type: 'texture', value: '', weight: 0.3, enabled: false },
  { id: 'energy', type: 'energy', value: '', weight: 0.5, enabled: true },
  { id: 'style', type: 'style', value: '', weight: 0.3, enabled: false },
  { id: 'custom', type: 'custom', value: '', weight: 0.5, enabled: false },
];

const DEFAULT_SETTINGS: GlobalSettings = {
  bpm: 120,
  key: 'C',
  scale: 'minor',
  density: 0.5,
  brightness: 0.5,
  duration: 20,
};

export function usePromptDJEnhanced() {
  const [channels, setChannels] = useState<PromptChannel[]>(DEFAULT_CHANNELS);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  
  // Audio refs
  const playerRef = useRef<Tone.Player | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  
  // Cache for generated audio (prompt -> audioUrl)
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  
  // Audio buffer pool for preloading
  const bufferPoolRef = useRef<Map<string, Tone.ToneAudioBuffer>>(new Map());

  // Initialize analyzer
  useEffect(() => {
    analyzerRef.current = new Tone.Analyser('fft', 64);
    return () => {
      analyzerRef.current?.dispose();
      playerRef.current?.dispose();
      synthRef.current?.dispose();
      sequenceRef.current?.dispose();
      bufferPoolRef.current.forEach(buffer => buffer.dispose());
    };
  }, []);

  // Build weighted prompt from channels
  const currentPrompt = useMemo(() => {
    const parts: string[] = [];
    
    channels.forEach(channel => {
      if (!channel.enabled || !channel.value || channel.weight < 0.1) return;
      
      // Apply weight emphasis
      const emphasis = channel.weight > 0.7 ? 'very ' : channel.weight > 0.4 ? '' : 'subtle ';
      parts.push(`${emphasis}${channel.value.toLowerCase()}`);
    });

    // Add global settings
    parts.push(`${globalSettings.bpm} BPM`);
    parts.push(`${globalSettings.key} ${globalSettings.scale}`);
    
    if (globalSettings.density < 0.3) parts.push('sparse, minimal');
    else if (globalSettings.density > 0.7) parts.push('dense, layered');
    
    if (globalSettings.brightness < 0.3) parts.push('warm, mellow');
    else if (globalSettings.brightness > 0.7) parts.push('bright, crisp');

    return parts.filter(Boolean).join(', ');
  }, [channels, globalSettings]);

  // Update channel
  const updateChannel = useCallback((id: string, updates: Partial<PromptChannel>) => {
    setChannels(prev => prev.map(ch => 
      ch.id === id ? { ...ch, ...updates } : ch
    ));
  }, []);

  // Update global settings
  const updateGlobalSettings = useCallback((updates: Partial<GlobalSettings>) => {
    setGlobalSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Generate music with caching
  const generateMusic = useCallback(async () => {
    if (!currentPrompt.trim()) {
      toast.error('Настройте каналы для генерации');
      return;
    }

    // Check cache first
    const cachedUrl = audioCacheRef.current.get(currentPrompt);
    if (cachedUrl) {
      const cachedTrack: GeneratedTrack = {
        id: crypto.randomUUID(),
        prompt: currentPrompt,
        audioUrl: cachedUrl,
        createdAt: new Date(),
      };
      setGeneratedTracks(prev => [cachedTrack, ...prev]);
      toast.success('Трек загружен из кэша!');
      playTrack(cachedTrack);
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('musicgen-generate', {
        body: {
          prompt: currentPrompt,
          duration: globalSettings.duration,
          temperature: 1.0,
        }
      });

      if (error) throw error;

      if (data?.audio_url) {
        // Cache the result
        audioCacheRef.current.set(currentPrompt, data.audio_url);
        
        // Preload into buffer pool
        try {
          const buffer = new Tone.ToneAudioBuffer(data.audio_url);
          bufferPoolRef.current.set(currentPrompt, buffer);
        } catch {}

        const newTrack: GeneratedTrack = {
          id: crypto.randomUUID(),
          prompt: currentPrompt,
          audioUrl: data.audio_url,
          createdAt: new Date(),
        };
        
        setGeneratedTracks(prev => [newTrack, ...prev]);
        toast.success('Трек сгенерирован!');
        playTrack(newTrack);
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Ошибка генерации');
    } finally {
      setIsGenerating(false);
    }
  }, [currentPrompt, globalSettings.duration]);

  // Play track with buffering
  const playTrack = useCallback(async (track: GeneratedTrack) => {
    try {
      await Tone.start();
      
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current.dispose();
      }

      // Check buffer pool first
      const cachedBuffer = bufferPoolRef.current.get(track.prompt);
      
      const player = new Tone.Player();
      
      if (analyzerRef.current) {
        player.connect(analyzerRef.current);
      }
      player.toDestination();
      
      if (cachedBuffer && cachedBuffer.loaded) {
        player.buffer = cachedBuffer;
        player.start();
      } else {
        await player.load(track.audioUrl);
        player.start();
        
        // Cache buffer for future use
        if (player.buffer) {
          bufferPoolRef.current.set(track.prompt, player.buffer);
        }
      }
      
      playerRef.current = player;
      setCurrentTrack(track);
      setIsPlaying(true);

      player.onstop = () => {
        setIsPlaying(false);
      };
    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Ошибка воспроизведения');
    }
  }, []);

  // Stop playback
  const stopPlayback = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    setIsPlaying(false);
  }, []);

  // Preview with synth (realtime local synthesis)
  const previewWithSynth = useCallback(async () => {
    try {
      await Tone.start();
      stopPreview();

      // Create synth based on settings
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: globalSettings.brightness > 0.6 ? 'sawtooth' : 
                globalSettings.brightness > 0.3 ? 'triangle' : 'sine',
        },
        envelope: {
          attack: 0.05 + (1 - globalSettings.density) * 0.2,
          decay: 0.2,
          sustain: 0.4,
          release: 0.5 + globalSettings.density * 0.5,
        },
      });

      // Add effects based on mood/texture channels
      const moodChannel = channels.find(c => c.type === 'mood');
      const textureChannel = channels.find(c => c.type === 'texture');
      
      // Add reverb for atmospheric moods
      if (moodChannel?.value?.toLowerCase().includes('dreamy') || 
          textureChannel?.value?.toLowerCase().includes('airy')) {
        const reverb = new Tone.Reverb({ decay: 3, wet: 0.5 });
        synth.connect(reverb);
        reverb.toDestination();
      }

      if (analyzerRef.current) {
        synth.connect(analyzerRef.current);
      }
      synth.toDestination();
      synthRef.current = synth;

      // Generate scale notes
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const rootIndex = noteNames.indexOf(globalSettings.key);
      const scaleIntervals = globalSettings.scale === 'major' 
        ? [0, 2, 4, 5, 7, 9, 11] 
        : [0, 2, 3, 5, 7, 8, 10];

      const octave = 4;
      const notes = scaleIntervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
        return `${noteNames[noteIndex]}${noteOctave}`;
      });

      // Create pattern based on energy/density
      const energyChannel = channels.find(c => c.type === 'energy');
      const isHighEnergy = energyChannel?.value?.toLowerCase().includes('high') || 
                          energyChannel?.value?.toLowerCase().includes('intense');
      
      const stepCount = isHighEnergy ? 16 : 8;
      const noteDensity = 0.3 + globalSettings.density * 0.5;
      
      const pattern: (string | null)[] = [];
      for (let i = 0; i < stepCount; i++) {
        if (Math.random() < noteDensity) {
          pattern.push(notes[Math.floor(Math.random() * notes.length)]);
        } else {
          pattern.push(null);
        }
      }

      Tone.getTransport().bpm.value = globalSettings.bpm;

      const sequence = new Tone.Sequence(
        (time, note) => {
          if (note) {
            synth.triggerAttackRelease(note, isHighEnergy ? '16n' : '8n', time);
          }
        },
        pattern,
        isHighEnergy ? '16n' : '8n'
      );

      sequence.start(0);
      sequenceRef.current = sequence;
      
      Tone.getTransport().start();
      setIsPreviewPlaying(true);

      // Auto-stop after 6 seconds
      setTimeout(() => {
        stopPreview();
      }, 6000);
    } catch (error) {
      console.error('Preview error:', error);
    }
  }, [globalSettings, channels]);

  // Stop preview
  const stopPreview = useCallback(() => {
    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
    Tone.getTransport().stop();
    setIsPreviewPlaying(false);
  }, []);

  // Remove track
  const removeTrack = useCallback((id: string) => {
    setGeneratedTracks(prev => prev.filter(t => t.id !== id));
    if (currentTrack?.id === id) {
      stopPlayback();
    }
  }, [currentTrack, stopPlayback]);

  return {
    channels,
    updateChannel,
    globalSettings,
    updateGlobalSettings,
    isGenerating,
    generatedTracks,
    generateMusic,
    previewWithSynth,
    stopPreview,
    isPreviewPlaying,
    isPlaying,
    currentTrack,
    playTrack,
    stopPlayback,
    currentPrompt,
    analyzerNode: analyzerRef.current,
    removeTrack,
    audioCache: audioCacheRef.current,
  };
}
