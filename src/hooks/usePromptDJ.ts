import { useState, useCallback, useRef, useEffect } from 'react';
import { buildPromptFromChannels } from '@/lib/prompt-dj-presets';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tone.js types - loaded dynamically to prevent "Cannot access 'e' before initialization" error
type ToneType = typeof import('tone');
type PlayerType = import('tone').Player;
type PolySynthType = import('tone').PolySynth;
type SequenceType = import('tone').Sequence;
type AnalyserType = import('tone').Analyser;

// Cached Tone module reference
let ToneModule: ToneType | null = null;

export interface PromptChannel {
  id: string;
  type: 'genre' | 'instrument' | 'mood' | 'custom';
  value: string;
  weight: number; // 0-2
  enabled: boolean;
  deck: 'A' | 'B' | 'both';
}

export interface GlobalSettings {
  bpm: number;
  key: string;
  scale: string;
  density: number; // 0-1
  brightness: number; // 0-1
  duration: number; // seconds
}

export interface GeneratedTrack {
  id: string;
  prompt: string;
  audioUrl: string;
  createdAt: Date;
}

interface UsePromptDJReturn {
  // Channels
  channels: PromptChannel[];
  updateChannel: (id: string, updates: Partial<PromptChannel>) => void;
  
  // Crossfader
  crossfaderPosition: number; // -1 (A) to 1 (B)
  setCrossfaderPosition: (pos: number) => void;
  
  // Global settings
  globalSettings: GlobalSettings;
  updateGlobalSettings: (updates: Partial<GlobalSettings>) => void;
  
  // Generation
  isGenerating: boolean;
  generatedTracks: GeneratedTrack[];
  generateMusic: () => Promise<void>;
  removeTrack: (id: string) => void;
  
  // Playback
  isPlaying: boolean;
  currentTrack: GeneratedTrack | null;
  playTrack: (track: GeneratedTrack) => void;
  stopPlayback: () => void;
  
  // Preview synth
  previewPrompt: () => void;
  stopPreview: () => void;
  isPreviewPlaying: boolean;
  
  // Built prompt
  currentPrompt: string;
  
  // Analyzer for visualizer
  analyzerNode: AnalyserType | null;
}

const DEFAULT_CHANNELS: PromptChannel[] = [
  { id: 'genre', type: 'genre', value: 'electronic', weight: 1, enabled: true, deck: 'both' },
  { id: 'instrument', type: 'instrument', value: 'synth', weight: 1, enabled: true, deck: 'both' },
  { id: 'mood', type: 'mood', value: 'energetic', weight: 1, enabled: true, deck: 'both' },
  { id: 'custom', type: 'custom', value: '', weight: 1, enabled: false, deck: 'both' },
];

const DEFAULT_SETTINGS: GlobalSettings = {
  bpm: 120,
  key: 'C',
  scale: 'minor',
  density: 0.5,
  brightness: 0.5,
  duration: 30,
};

export function usePromptDJ(): UsePromptDJReturn {
  const [channels, setChannels] = useState<PromptChannel[]>(DEFAULT_CHANNELS);
  const [crossfaderPosition, setCrossfaderPosition] = useState(0);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  
  const playerRef = useRef<PlayerType | null>(null);
  const synthRef = useRef<PolySynthType | null>(null);
  const sequenceRef = useRef<SequenceType | null>(null);
  const analyzerRef = useRef<AnalyserType | null>(null);

  // Initialize analyzer with dynamic import
  useEffect(() => {
    const initAnalyzer = async () => {
      if (!ToneModule) {
        ToneModule = await import('tone');
      }
      analyzerRef.current = new ToneModule.Analyser('fft', 64);
    };
    initAnalyzer();
    
    return () => {
      analyzerRef.current?.dispose();
      playerRef.current?.dispose();
      synthRef.current?.dispose();
      sequenceRef.current?.dispose();
    };
  }, []);

  // Apply crossfader to channel weights
  const getEffectiveChannels = useCallback(() => {
    return channels.map(channel => {
      let effectiveWeight = channel.weight;
      
      if (channel.deck === 'A') {
        // Fade out as crossfader moves to B
        effectiveWeight *= Math.max(0, 1 - crossfaderPosition);
      } else if (channel.deck === 'B') {
        // Fade in as crossfader moves to B
        effectiveWeight *= Math.max(0, 1 + crossfaderPosition);
      }
      // 'both' stays at original weight
      
      return { ...channel, weight: effectiveWeight };
    });
  }, [channels, crossfaderPosition]);

  // Build current prompt
  const currentPrompt = buildPromptFromChannels(getEffectiveChannels(), globalSettings);

  const updateChannel = useCallback((id: string, updates: Partial<PromptChannel>) => {
    setChannels(prev => prev.map(ch => 
      ch.id === id ? { ...ch, ...updates } : ch
    ));
  }, []);

  const updateGlobalSettings = useCallback((updates: Partial<GlobalSettings>) => {
    setGlobalSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Generate music via edge function
  const generateMusic = useCallback(async () => {
    if (!currentPrompt.trim()) {
      toast.error('Настройте каналы для генерации');
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
        const newTrack: GeneratedTrack = {
          id: crypto.randomUUID(),
          prompt: currentPrompt,
          audioUrl: data.audio_url,
          createdAt: new Date(),
        };
        
        setGeneratedTracks(prev => [newTrack, ...prev]);
        toast.success('Трек сгенерирован!');
        
        // Auto-play the new track
        playTrack(newTrack);
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Ошибка генерации. Попробуйте снова.');
    } finally {
      setIsGenerating(false);
    }
  }, [currentPrompt, globalSettings.duration]);

  // Playback controls
  const playTrack = useCallback(async (track: GeneratedTrack) => {
    try {
      if (!ToneModule) {
        ToneModule = await import('tone');
      }
      const Tone = ToneModule;
      
      await Tone.start();
      
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current.dispose();
      }

      const player = new Tone.Player(track.audioUrl);
      
      if (analyzerRef.current) {
        player.connect(analyzerRef.current);
      }
      player.toDestination();
      
      await player.load(track.audioUrl);
      player.start();
      
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

  const stopPlayback = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    setIsPlaying(false);
  }, []);

  // Preview with synth (local synthesis based on prompt parameters)
  const previewPrompt = useCallback(async () => {
    try {
      if (!ToneModule) {
        ToneModule = await import('tone');
      }
      const Tone = ToneModule;
      
      await Tone.start();
      stopPreview();

      // Create synth based on brightness
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: globalSettings.brightness > 0.5 ? 'sawtooth' : 'triangle',
        },
        envelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.5,
          release: 0.8,
        },
      });

      if (analyzerRef.current) {
        synth.connect(analyzerRef.current);
      }
      synth.toDestination();
      synthRef.current = synth;

      // Generate notes based on key and scale
      const rootNote = globalSettings.key;
      const octave = 4;
      const scaleNotes = globalSettings.scale === 'major' 
        ? [0, 2, 4, 5, 7, 9, 11] 
        : [0, 2, 3, 5, 7, 8, 10];

      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const rootIndex = noteNames.indexOf(rootNote);

      const notes = scaleNotes.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
        return `${noteNames[noteIndex]}${noteOctave}`;
      });

      // Create pattern based on density
      const stepCount = Math.round(8 + globalSettings.density * 8);
      const pattern: (string | null)[] = [];
      
      for (let i = 0; i < stepCount; i++) {
        if (Math.random() < globalSettings.density) {
          pattern.push(notes[Math.floor(Math.random() * notes.length)]);
        } else {
          pattern.push(null);
        }
      }

      Tone.getTransport().bpm.value = globalSettings.bpm;

      const sequence = new Tone.Sequence(
        (time, note) => {
          if (note) {
            synth.triggerAttackRelease(note, '8n', time);
          }
        },
        pattern,
        '8n'
      );

      sequence.start(0);
      sequenceRef.current = sequence;
      
      Tone.getTransport().start();
      setIsPreviewPlaying(true);

      // Auto-stop after 8 seconds
      setTimeout(() => {
        stopPreview();
      }, 8000);
    } catch (error) {
      console.error('Preview error:', error);
    }
  }, [globalSettings]);

  const stopPreview = useCallback(async () => {
    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
    if (ToneModule) {
      ToneModule.getTransport().stop();
    }
    setIsPreviewPlaying(false);
  }, []);

  const removeTrack = useCallback((id: string) => {
    setGeneratedTracks(prev => prev.filter(t => t.id !== id));
    if (currentTrack?.id === id) {
      stopPlayback();
    }
  }, [currentTrack, stopPlayback]);

  return {
    channels,
    updateChannel,
    crossfaderPosition,
    setCrossfaderPosition,
    globalSettings,
    updateGlobalSettings,
    isGenerating,
    generatedTracks,
    generateMusic,
    removeTrack,
    isPlaying,
    currentTrack,
    playTrack,
    stopPlayback,
    previewPrompt,
    stopPreview,
    isPreviewPlaying,
    currentPrompt,
    analyzerNode: analyzerRef.current,
  };
}
