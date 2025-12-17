/**
 * usePromptDJEnhanced - Enhanced PromptDJ hook with real-time reactive synthesis
 * Optimized for performance with buffering, memoization and batched updates
 */

import { useState, useCallback, useRef, useEffect, useMemo, useDeferredValue, useTransition } from 'react';
import * as Tone from 'tone';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';

// Available channel types that users can choose from
export const CHANNEL_TYPES = [
  { 
    type: 'genre', 
    label: 'Жанр', 
    color: '#a855f7',
    presets: ['Electronic', 'Hip-Hop', 'Rock', 'Jazz', 'Pop', 'Ambient', 'Lo-Fi', 'EDM', 'Classical', 'Trap', 'R&B', 'House']
  },
  { 
    type: 'instrument', 
    label: 'Инструмент', 
    color: '#3b82f6',
    presets: ['Piano', 'Guitar', 'Synth', 'Strings', 'Bass', 'Drums', 'Pads', 'Brass', 'Bells', 'Choir', 'Violin', 'Sax']
  },
  { 
    type: 'mood', 
    label: 'Настроение', 
    color: '#ec4899',
    presets: ['Energetic', 'Calm', 'Dark', 'Happy', 'Epic', 'Dreamy', 'Aggressive', 'Romantic', 'Mysterious', 'Groovy', 'Sad', 'Uplifting']
  },
  { 
    type: 'energy', 
    label: 'Энергия', 
    color: '#ef4444',
    presets: ['Low', 'Medium', 'High', 'Building', 'Dropping', 'Intense', 'Relaxed', 'Driving', 'Floating', 'Explosive']
  },
  { 
    type: 'texture', 
    label: 'Текстура', 
    color: '#f59e0b',
    presets: ['Smooth', 'Gritty', 'Airy', 'Dense', 'Sparse', 'Layered', 'Vintage', 'Modern', 'Organic', 'Digital']
  },
  { 
    type: 'style', 
    label: 'Стиль', 
    color: '#22c55e',
    presets: ['Minimalist', 'Maximalist', 'Retro', 'Futuristic', 'Cinematic', 'Experimental', 'Acoustic', 'Synthwave']
  },
  { 
    type: 'vocal', 
    label: 'Вокал', 
    color: '#06b6d4',
    presets: ['Male', 'Female', 'Choir', 'Whisper', 'Powerful', 'Soft', 'Rap', 'Falsetto', 'No vocals']
  },
  { 
    type: 'tempo', 
    label: 'Темп', 
    color: '#8b5cf6',
    presets: ['Slow', 'Medium', 'Fast', 'Accelerating', 'Decelerating', 'Steady', 'Varying', 'Groove']
  },
  { 
    type: 'custom', 
    label: 'Своё', 
    color: '#64748b',
    presets: []
  },
] as const;

export type ChannelType = typeof CHANNEL_TYPES[number]['type'];

export interface PromptChannel {
  id: string;
  type: ChannelType;
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

// Default 9 channels (3x3 grid)
const DEFAULT_CHANNELS: PromptChannel[] = [
  // Row 1
  { id: 'ch1', type: 'genre', value: '', weight: 0.5, enabled: true },
  { id: 'ch2', type: 'instrument', value: '', weight: 0.5, enabled: true },
  { id: 'ch3', type: 'mood', value: '', weight: 0.5, enabled: true },
  // Row 2
  { id: 'ch4', type: 'energy', value: '', weight: 0.5, enabled: true },
  { id: 'ch5', type: 'texture', value: '', weight: 0.3, enabled: false },
  { id: 'ch6', type: 'style', value: '', weight: 0.3, enabled: false },
  // Row 3
  { id: 'ch7', type: 'instrument', value: '', weight: 0.3, enabled: false },
  { id: 'ch8', type: 'vocal', value: '', weight: 0.3, enabled: false },
  { id: 'ch9', type: 'custom', value: '', weight: 0.3, enabled: false },
];

const DEFAULT_SETTINGS: GlobalSettings = {
  bpm: 120,
  key: 'C',
  scale: 'minor',
  density: 0.5,
  brightness: 0.5,
  duration: 20,
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Audio buffer cache - persists across component remounts
const globalAudioCache = new Map<string, string>();
const globalBufferPool = new Map<string, Tone.ToneAudioBuffer>();

// Preload buffer async
const preloadBuffer = async (url: string, prompt: string) => {
  if (globalBufferPool.has(prompt)) return;
  try {
    const buffer = new Tone.ToneAudioBuffer(url, () => {
      globalBufferPool.set(prompt, buffer);
    });
  } catch (e) {
    console.warn('Buffer preload failed:', e);
  }
};

export function usePromptDJEnhanced() {
  const [channels, setChannels] = useState<PromptChannel[]>(DEFAULT_CHANNELS);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Live mode state
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'generating' | 'playing' | 'transitioning'>('idle');
  const lastGeneratedPromptRef = useRef<string>('');
  const liveGenerationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isGeneratingLiveRef = useRef(false);
  
  // Audio refs
  const playerRef = useRef<Tone.Player | null>(null);
  const nextPlayerRef = useRef<Tone.Player | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const gainNodeRef = useRef<Tone.Gain | null>(null);
  const nextGainNodeRef = useRef<Tone.Gain | null>(null);
  
  // Pattern state for real-time updates
  const patternRef = useRef<(string | null)[]>([]);
  const scaleNotesRef = useRef<string[]>([]);
  
  // Use global caches
  const audioCacheRef = useRef(globalAudioCache);
  const bufferPoolRef = useRef(globalBufferPool);

  // Compute scale notes based on key and scale
  const computeScaleNotes = useCallback((key: string, scale: string) => {
    const rootIndex = NOTE_NAMES.indexOf(key);
    const scaleIntervals = scale === 'major' 
      ? [0, 2, 4, 5, 7, 9, 11] 
      : scale === 'minor'
      ? [0, 2, 3, 5, 7, 8, 10]
      : scale === 'dorian'
      ? [0, 2, 3, 5, 7, 9, 10]
      : scale === 'pentatonic'
      ? [0, 2, 4, 7, 9]
      : [0, 2, 3, 5, 7, 8, 10]; // default minor

    const octave = 4;
    return scaleIntervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
      return `${NOTE_NAMES[noteIndex]}${noteOctave}`;
    });
  }, []);

  // Initialize analyzer
  useEffect(() => {
    analyzerRef.current = new Tone.Analyser('fft', 64);
    return () => {
      analyzerRef.current?.dispose();
      playerRef.current?.dispose();
      synthRef.current?.dispose();
      sequenceRef.current?.dispose();
      reverbRef.current?.dispose();
      filterRef.current?.dispose();
      delayRef.current?.dispose();
      bufferPoolRef.current.forEach(buffer => buffer.dispose());
    };
  }, []);

  // REAL-TIME: Update BPM when it changes
  useEffect(() => {
    if (isPreviewPlaying) {
      Tone.getTransport().bpm.rampTo(globalSettings.bpm, 0.2);
    }
  }, [globalSettings.bpm, isPreviewPlaying]);

  // REAL-TIME: Update synth sound when brightness changes
  useEffect(() => {
    if (isPreviewPlaying && synthRef.current) {
      const oscType = globalSettings.brightness > 0.7 ? 'sawtooth' : 
                      globalSettings.brightness > 0.4 ? 'triangle' : 'sine';
      
      synthRef.current.set({
        oscillator: { type: oscType as any },
        envelope: {
          attack: 0.02 + (1 - globalSettings.brightness) * 0.1,
          release: 0.3 + (1 - globalSettings.brightness) * 0.4,
        }
      });
    }
  }, [globalSettings.brightness, isPreviewPlaying]);

  // REAL-TIME: Update filter based on brightness
  useEffect(() => {
    if (isPreviewPlaying && filterRef.current) {
      const freq = 200 + globalSettings.brightness * 4000;
      filterRef.current.frequency.rampTo(freq, 0.1);
    }
  }, [globalSettings.brightness, isPreviewPlaying]);

  // REAL-TIME: Update reverb based on mood/texture
  useEffect(() => {
    if (isPreviewPlaying && reverbRef.current) {
      const moodChannel = channels.find(c => c.type === 'mood');
      const textureChannel = channels.find(c => c.type === 'texture');
      
      const isDreamy = moodChannel?.value?.toLowerCase().includes('dreamy') ||
                       textureChannel?.value?.toLowerCase().includes('airy') ||
                       textureChannel?.value?.toLowerCase().includes('ambient');
      
      reverbRef.current.wet.rampTo(isDreamy ? 0.6 : 0.2, 0.3);
    }
  }, [channels, isPreviewPlaying]);

  // REAL-TIME: Update scale notes when key/scale changes
  useEffect(() => {
    scaleNotesRef.current = computeScaleNotes(globalSettings.key, globalSettings.scale);
  }, [globalSettings.key, globalSettings.scale, computeScaleNotes]);

  // REAL-TIME: Regenerate pattern when density changes
  useEffect(() => {
    if (isPreviewPlaying && scaleNotesRef.current.length > 0) {
      const energyChannel = channels.find(c => c.type === 'energy');
      const isHighEnergy = energyChannel?.enabled && (
        energyChannel?.weight > 0.6 ||
        energyChannel?.value?.toLowerCase().includes('high') || 
        energyChannel?.value?.toLowerCase().includes('intense')
      );
      
      const stepCount = isHighEnergy ? 16 : 8;
      const noteDensity = 0.2 + globalSettings.density * 0.6;
      
      const newPattern: (string | null)[] = [];
      for (let i = 0; i < stepCount; i++) {
        if (Math.random() < noteDensity) {
          newPattern.push(scaleNotesRef.current[Math.floor(Math.random() * scaleNotesRef.current.length)]);
        } else {
          newPattern.push(null);
        }
      }
      patternRef.current = newPattern;
      
      // Update sequence events
      if (sequenceRef.current) {
        sequenceRef.current.events = newPattern;
      }
    }
  }, [globalSettings.density, channels, isPreviewPlaying]);

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

  // Debounced channel update for weight changes (smooth knob interaction)
  const debouncedChannelUpdate = useDebouncedCallback(
    (id: string, updates: Partial<PromptChannel>) => {
      startTransition(() => {
        setChannels(prev => prev.map(ch => 
          ch.id === id ? { ...ch, ...updates } : ch
        ));
      });
    },
    16, // ~60fps
    { leading: true, trailing: true, maxWait: 50 }
  );

  // Update channel - immediate for non-weight, debounced for weight
  const updateChannel = useCallback((id: string, updates: Partial<PromptChannel>) => {
    if ('weight' in updates && Object.keys(updates).length === 1) {
      // Weight-only updates are debounced for smooth knob interaction
      debouncedChannelUpdate(id, updates);
    } else {
      // Other updates are immediate
      setChannels(prev => prev.map(ch => 
        ch.id === id ? { ...ch, ...updates } : ch
      ));
    }
  }, [debouncedChannelUpdate]);

  // Debounced global settings update
  const debouncedSettingsUpdate = useDebouncedCallback(
    (updates: Partial<GlobalSettings>) => {
      startTransition(() => {
        setGlobalSettings(prev => ({ ...prev, ...updates }));
      });
    },
    16,
    { leading: true, trailing: true, maxWait: 50 }
  );

  // Update global settings
  const updateGlobalSettings = useCallback((updates: Partial<GlobalSettings>) => {
    // Debounce continuous values like BPM slider
    if ('bpm' in updates || 'density' in updates || 'brightness' in updates) {
      debouncedSettingsUpdate(updates);
    } else {
      setGlobalSettings(prev => ({ ...prev, ...updates }));
    }
  }, [debouncedSettingsUpdate]);

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
      stopPreview();
      
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

  // Start real-time preview with synth
  const previewWithSynth = useCallback(async () => {
    try {
      await Tone.start();
      stopPreview();

      // Create filter for brightness control
      const filter = new Tone.Filter({
        frequency: 200 + globalSettings.brightness * 4000,
        type: 'lowpass',
        rolloff: -12,
      });
      filterRef.current = filter;

      // Create reverb
      const reverb = new Tone.Reverb({ 
        decay: 2.5, 
        wet: 0.2,
        preDelay: 0.01,
      });
      await reverb.generate();
      reverbRef.current = reverb;

      // Create delay for texture
      const delay = new Tone.FeedbackDelay({
        delayTime: '8n',
        feedback: 0.2,
        wet: 0.15,
      });
      delayRef.current = delay;

      // Create synth based on settings
      const oscType = globalSettings.brightness > 0.7 ? 'sawtooth' : 
                      globalSettings.brightness > 0.4 ? 'triangle' : 'sine';
      
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: oscType as any },
        envelope: {
          attack: 0.02 + (1 - globalSettings.brightness) * 0.1,
          decay: 0.2,
          sustain: 0.4,
          release: 0.3 + (1 - globalSettings.brightness) * 0.4,
        },
      });

      // Connect chain: synth -> filter -> delay -> reverb -> analyzer -> destination
      synth.connect(filter);
      filter.connect(delay);
      delay.connect(reverb);
      
      if (analyzerRef.current) {
        reverb.connect(analyzerRef.current);
      }
      reverb.toDestination();
      
      synthRef.current = synth;

      // Generate initial scale notes
      scaleNotesRef.current = computeScaleNotes(globalSettings.key, globalSettings.scale);

      // Generate initial pattern
      const energyChannel = channels.find(c => c.type === 'energy');
      const isHighEnergy = energyChannel?.enabled && (
        energyChannel?.weight > 0.6 ||
        energyChannel?.value?.toLowerCase().includes('high') || 
        energyChannel?.value?.toLowerCase().includes('intense')
      );
      
      const stepCount = isHighEnergy ? 16 : 8;
      const noteDensity = 0.2 + globalSettings.density * 0.6;
      
      const pattern: (string | null)[] = [];
      for (let i = 0; i < stepCount; i++) {
        if (Math.random() < noteDensity) {
          pattern.push(scaleNotesRef.current[Math.floor(Math.random() * scaleNotesRef.current.length)]);
        } else {
          pattern.push(null);
        }
      }
      patternRef.current = pattern;

      Tone.getTransport().bpm.value = globalSettings.bpm;

      const sequence = new Tone.Sequence(
        (time, note) => {
          if (note && synthRef.current) {
            const noteLength = isHighEnergy ? '16n' : '8n';
            synthRef.current.triggerAttackRelease(note, noteLength, time);
          }
        },
        pattern,
        isHighEnergy ? '16n' : '8n'
      );

      sequence.loop = true;
      sequence.start(0);
      sequenceRef.current = sequence;
      
      Tone.getTransport().start();
      setIsPreviewPlaying(true);

    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Ошибка запуска превью');
    }
  }, [globalSettings, channels, computeScaleNotes]);

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
    if (reverbRef.current) {
      reverbRef.current.dispose();
      reverbRef.current = null;
    }
    if (filterRef.current) {
      filterRef.current.dispose();
      filterRef.current = null;
    }
    if (delayRef.current) {
      delayRef.current.dispose();
      delayRef.current = null;
    }
    Tone.getTransport().stop();
    setIsPreviewPlaying(false);
  }, []);

  // Live mode: Generate and play with crossfade transitions
  const generateForLive = useCallback(async (prompt: string): Promise<string | null> => {
    // Check cache first
    const cachedUrl = audioCacheRef.current.get(prompt);
    if (cachedUrl) return cachedUrl;

    try {
      const { data, error } = await supabase.functions.invoke('musicgen-generate', {
        body: {
          prompt,
          duration: globalSettings.duration,
          temperature: 1.0,
        }
      });

      if (error) throw error;

      if (data?.audio_url) {
        audioCacheRef.current.set(prompt, data.audio_url);
        return data.audio_url;
      }
      return null;
    } catch (error) {
      console.error('Live generation error:', error);
      return null;
    }
  }, [globalSettings.duration]);

  // Crossfade to new track
  const crossfadeToTrack = useCallback(async (audioUrl: string, prompt: string) => {
    try {
      await Tone.start();
      setLiveStatus('transitioning');

      // Create new player
      const newPlayer = new Tone.Player();
      const newGain = new Tone.Gain(0); // Start silent
      
      newPlayer.connect(newGain);
      if (analyzerRef.current) {
        newGain.connect(analyzerRef.current);
      }
      newGain.toDestination();
      newPlayer.loop = true;
      
      await newPlayer.load(audioUrl);
      newPlayer.start();
      
      nextPlayerRef.current = newPlayer;
      nextGainNodeRef.current = newGain;

      // Crossfade over 2 seconds
      const fadeTime = 2;
      
      // Fade out current
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.rampTo(0, fadeTime);
      }
      
      // Fade in new
      newGain.gain.rampTo(1, fadeTime);

      // After fade, clean up old player
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.stop();
          playerRef.current.dispose();
        }
        if (gainNodeRef.current) {
          gainNodeRef.current.dispose();
        }
        
        // Swap refs
        playerRef.current = nextPlayerRef.current;
        gainNodeRef.current = nextGainNodeRef.current;
        nextPlayerRef.current = null;
        nextGainNodeRef.current = null;
        
        // Update track state
        const newTrack: GeneratedTrack = {
          id: crypto.randomUUID(),
          prompt,
          audioUrl,
          createdAt: new Date(),
        };
        setCurrentTrack(newTrack);
        setGeneratedTracks(prev => [newTrack, ...prev.slice(0, 9)]); // Keep last 10
        setLiveStatus('playing');
      }, fadeTime * 1000 + 100);

    } catch (error) {
      console.error('Crossfade error:', error);
      setLiveStatus('playing');
    }
  }, []);

  // Start live mode
  const startLiveMode = useCallback(async () => {
    if (!currentPrompt.trim()) {
      toast.error('Настройте каналы для генерации');
      return;
    }

    setIsLiveMode(true);
    setLiveStatus('generating');
    isGeneratingLiveRef.current = true;
    toast.info('🎧 Генерация первого сегмента...');

    try {
      await Tone.start();
      
      const audioUrl = await generateForLive(currentPrompt);
      
      if (!audioUrl) {
        toast.error('Ошибка генерации');
        setIsLiveMode(false);
        setLiveStatus('idle');
        isGeneratingLiveRef.current = false;
        return;
      }

      // Remember what we generated
      lastGeneratedPromptRef.current = currentPrompt;

      // Create initial player with gain for crossfade support
      const player = new Tone.Player();
      const gain = new Tone.Gain(1);
      
      player.connect(gain);
      if (analyzerRef.current) {
        gain.connect(analyzerRef.current);
      }
      gain.toDestination();
      player.loop = true;
      
      await player.load(audioUrl);
      player.start();
      
      playerRef.current = player;
      gainNodeRef.current = gain;
      
      const newTrack: GeneratedTrack = {
        id: crypto.randomUUID(),
        prompt: currentPrompt,
        audioUrl,
        createdAt: new Date(),
      };
      
      setCurrentTrack(newTrack);
      setGeneratedTracks(prev => [newTrack, ...prev]);
      setIsPlaying(true);
      setLiveStatus('playing');
      isGeneratingLiveRef.current = false;
      
      toast.success('🎵 Live сессия запущена! Меняйте настройки для нового звучания');
      
    } catch (error) {
      console.error('Start live error:', error);
      toast.error('Ошибка запуска Live режима');
      setIsLiveMode(false);
      setLiveStatus('idle');
      isGeneratingLiveRef.current = false;
    }
  }, [currentPrompt, generateForLive]);

  // Stop live mode
  const stopLiveMode = useCallback(() => {
    if (liveGenerationTimeoutRef.current) {
      clearTimeout(liveGenerationTimeoutRef.current);
    }
    
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current.dispose();
      playerRef.current = null;
    }
    if (nextPlayerRef.current) {
      nextPlayerRef.current.stop();
      nextPlayerRef.current.dispose();
      nextPlayerRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.dispose();
      gainNodeRef.current = null;
    }
    if (nextGainNodeRef.current) {
      nextGainNodeRef.current.dispose();
      nextGainNodeRef.current = null;
    }
    
    lastGeneratedPromptRef.current = '';
    isGeneratingLiveRef.current = false;
    setIsLiveMode(false);
    setLiveStatus('idle');
    setIsPlaying(false);
    toast.info('Live сессия остановлена');
  }, []);

  // Auto-trigger generation when prompt changes in live mode
  useEffect(() => {
    // Only proceed if in live mode
    if (!isLiveMode) return;
    
    // Don't queue if already generating
    if (isGeneratingLiveRef.current) return;
    
    // Don't regenerate for same prompt
    if (currentPrompt === lastGeneratedPromptRef.current) return;
    
    // Clear any pending timeout
    if (liveGenerationTimeoutRef.current) {
      clearTimeout(liveGenerationTimeoutRef.current);
    }
    
    // Debounce: wait 2 seconds after last change before generating
    liveGenerationTimeoutRef.current = setTimeout(async () => {
      // Double check we're still in live mode
      if (!isLiveMode) return;
      
      // Prevent concurrent generations
      if (isGeneratingLiveRef.current) return;
      isGeneratingLiveRef.current = true;
      
      const promptToGenerate = currentPrompt;
      
      // Skip if same as last generated
      if (promptToGenerate === lastGeneratedPromptRef.current) {
        isGeneratingLiveRef.current = false;
        return;
      }
      
      setLiveStatus('generating');
      toast.info('🎵 Генерация нового сегмента...');
      
      try {
        const audioUrl = await generateForLive(promptToGenerate);
        
        if (audioUrl) {
          lastGeneratedPromptRef.current = promptToGenerate;
          await crossfadeToTrack(audioUrl, promptToGenerate);
          toast.success('✨ Переход к новому звучанию');
        } else {
          setLiveStatus('playing');
        }
      } catch (error) {
        console.error('Live generation error:', error);
        setLiveStatus('playing');
      } finally {
        isGeneratingLiveRef.current = false;
      }
    }, 2000);
    
    return () => {
      if (liveGenerationTimeoutRef.current) {
        clearTimeout(liveGenerationTimeoutRef.current);
      }
    };
  }, [currentPrompt, isLiveMode, generateForLive, crossfadeToTrack]);

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
    // Live mode
    isLiveMode,
    liveStatus,
    startLiveMode,
    stopLiveMode,
  };
}
