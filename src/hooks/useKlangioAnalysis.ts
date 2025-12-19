import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type KlangioMode = 'transcription' | 'chord-recognition' | 'chord-recognition-extended' | 'beat-tracking';
export type TranscriptionModel = 'guitar' | 'piano' | 'drums' | 'vocal' | 'bass' | 'universal' | 'lead';
export type OutputFormat = 'midi' | 'mxml' | 'gp5' | 'pdf' | 'midi_quant';

export interface TranscriptionResult {
  job_id: string;
  mode: string;
  status: string;
  files?: {
    midi?: string;
    midi_quant?: string;
    mxml?: string;
    gp5?: string;
    pdf?: string;
  };
  notes?: NoteData[];
}

export interface ChordResult {
  job_id: string;
  mode: string;
  status: string;
  chords: ChordData[];
  key?: string;
  strumming?: StrummingData[];
}

export interface BeatResult {
  job_id: string;
  mode: string;
  status: string;
  bpm?: number;
  beats: number[];
  downbeats: number[];
  time_signature?: string;
}

export interface NoteData {
  pitch: number;
  startTime: number;
  endTime: number;
  duration: number;
  velocity: number;
  noteName?: string;
}

export interface ChordData {
  chord: string;
  startTime: number;
  endTime: number;
}

export interface StrummingData {
  time: number;
  direction: 'U' | 'D';
}

export type AnalysisStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'error';

interface AnalysisState<T> {
  status: AnalysisStatus;
  progress: number;
  result?: T;
  error?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_FORMATS = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/flac', 'audio/x-wav'];

export function useKlangioAnalysis() {
  const { user } = useAuth();
  
  const [transcription, setTranscription] = useState<AnalysisState<TranscriptionResult>>({ 
    status: 'idle', 
    progress: 0 
  });
  
  const [chords, setChords] = useState<AnalysisState<ChordResult>>({ 
    status: 'idle', 
    progress: 0 
  });
  
  const [beats, setBeats] = useState<AnalysisState<BeatResult>>({ 
    status: 'idle', 
    progress: 0 
  });

  const validateAudioUrl = useCallback(async (audioUrl: string): Promise<boolean> => {
    try {
      // Check if URL is valid
      new URL(audioUrl);
      
      // Try HEAD request to check file size
      const response = await fetch(audioUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error('Не удалось проверить аудиофайл');
      }
      
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
        throw new Error(`Файл слишком большой (макс. ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && !SUPPORTED_FORMATS.some(f => contentType.includes(f.split('/')[1]))) {
        console.warn(`[klangio] Unexpected content-type: ${contentType}, proceeding anyway`);
      }
      
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Файл')) {
        throw error;
      }
      console.warn('[klangio] Validation warning:', error);
      return true; // Proceed anyway for URLs we can't validate
    }
  }, []);

  const startTranscription = useCallback(async (
    audioUrl: string,
    model: TranscriptionModel = 'guitar',
    outputs: OutputFormat[] = ['midi', 'mxml', 'gp5', 'pdf'],
    title?: string
  ): Promise<TranscriptionResult | null> => {
    if (!audioUrl) {
      toast.error('Аудио URL не указан');
      return null;
    }

    try {
      setTranscription({ status: 'pending', progress: 5 });
      
      // Validate audio URL
      await validateAudioUrl(audioUrl);
      
      setTranscription(prev => ({ ...prev, progress: 10 }));

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setTranscription(prev => {
          if (prev.status !== 'processing' && prev.status !== 'pending') {
            clearInterval(progressInterval);
            return prev;
          }
          const newProgress = Math.min(prev.progress + 2, 90);
          return { 
            ...prev, 
            progress: newProgress,
            status: newProgress > 20 ? 'processing' : 'pending'
          };
        });
      }, 2000);

      const { data, error } = await supabase.functions.invoke('klangio-analyze', {
        body: {
          audio_url: audioUrl,
          mode: 'transcription',
          model,
          outputs,
          title,
          user_id: user?.id,
        },
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('[klangio] Transcription error:', error);
        setTranscription({ 
          status: 'error', 
          progress: 0, 
          error: error.message || 'Ошибка транскрипции' 
        });
        toast.error('Ошибка транскрипции', { description: error.message });
        return null;
      }

      if (data?.error) {
        const errorMsg = data.error === 'no_notes_found' 
          ? 'Не удалось распознать ноты в записи'
          : data.message || data.error;
        setTranscription({ status: 'error', progress: 0, error: errorMsg });
        toast.error('Ошибка транскрипции', { description: errorMsg });
        return null;
      }

      setTranscription({ 
        status: 'completed', 
        progress: 100, 
        result: data 
      });
      
      toast.success('Транскрипция завершена', {
        description: `Распознано ${data.notes?.length || 0} нот`
      });
      
      return data;
    } catch (error) {
      console.error('[klangio] Transcription error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setTranscription({ status: 'error', progress: 0, error: errorMsg });
      toast.error('Ошибка транскрипции', { description: errorMsg });
      return null;
    }
  }, [user?.id, validateAudioUrl]);

  const detectChords = useCallback(async (
    audioUrl: string,
    extended: boolean = true
  ): Promise<ChordResult | null> => {
    if (!audioUrl) {
      toast.error('Аудио URL не указан');
      return null;
    }

    try {
      setChords({ status: 'pending', progress: 10 });

      const progressInterval = setInterval(() => {
        setChords(prev => {
          if (prev.status !== 'processing' && prev.status !== 'pending') {
            clearInterval(progressInterval);
            return prev;
          }
          return { 
            ...prev, 
            progress: Math.min(prev.progress + 5, 85),
            status: prev.progress > 30 ? 'processing' : 'pending'
          };
        });
      }, 1000);

      const { data, error } = await supabase.functions.invoke('klangio-analyze', {
        body: {
          audio_url: audioUrl,
          mode: extended ? 'chord-recognition-extended' : 'chord-recognition',
          vocabulary: extended ? 'full' : 'major-minor',
          user_id: user?.id,
        },
      });

      clearInterval(progressInterval);

      if (error || data?.error) {
        const errorMsg = error?.message || data?.message || 'Ошибка распознавания аккордов';
        setChords({ status: 'error', progress: 0, error: errorMsg });
        toast.error('Ошибка распознавания', { description: errorMsg });
        return null;
      }

      setChords({ status: 'completed', progress: 100, result: data });
      toast.success('Аккорды распознаны', {
        description: `Найдено ${data.chords?.length || 0} аккордов`
      });
      
      return data;
    } catch (error) {
      console.error('[klangio] Chord detection error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setChords({ status: 'error', progress: 0, error: errorMsg });
      toast.error('Ошибка распознавания', { description: errorMsg });
      return null;
    }
  }, [user?.id]);

  const detectBeats = useCallback(async (
    audioUrl: string
  ): Promise<BeatResult | null> => {
    if (!audioUrl) {
      toast.error('Аудио URL не указан');
      return null;
    }

    try {
      setBeats({ status: 'pending', progress: 15 });

      const progressInterval = setInterval(() => {
        setBeats(prev => {
          if (prev.status !== 'processing' && prev.status !== 'pending') {
            clearInterval(progressInterval);
            return prev;
          }
          return { 
            ...prev, 
            progress: Math.min(prev.progress + 8, 80),
            status: prev.progress > 25 ? 'processing' : 'pending'
          };
        });
      }, 800);

      const { data, error } = await supabase.functions.invoke('klangio-analyze', {
        body: {
          audio_url: audioUrl,
          mode: 'beat-tracking',
          user_id: user?.id,
        },
      });

      clearInterval(progressInterval);

      if (error || data?.error) {
        const errorMsg = error?.message || data?.message || 'Ошибка определения ритма';
        setBeats({ status: 'error', progress: 0, error: errorMsg });
        toast.error('Ошибка определения ритма', { description: errorMsg });
        return null;
      }

      setBeats({ status: 'completed', progress: 100, result: data });
      toast.success('Ритм определён', {
        description: data.bpm ? `BPM: ${data.bpm}` : 'Данные получены'
      });
      
      return data;
    } catch (error) {
      console.error('[klangio] Beat detection error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setBeats({ status: 'error', progress: 0, error: errorMsg });
      toast.error('Ошибка определения ритма', { description: errorMsg });
      return null;
    }
  }, [user?.id]);

  const reset = useCallback(() => {
    setTranscription({ status: 'idle', progress: 0 });
    setChords({ status: 'idle', progress: 0 });
    setBeats({ status: 'idle', progress: 0 });
  }, []);

  const resetTranscription = useCallback(() => {
    setTranscription({ status: 'idle', progress: 0 });
  }, []);

  const resetChords = useCallback(() => {
    setChords({ status: 'idle', progress: 0 });
  }, []);

  const resetBeats = useCallback(() => {
    setBeats({ status: 'idle', progress: 0 });
  }, []);

  return {
    // States
    transcription,
    chords,
    beats,
    
    // Actions
    startTranscription,
    detectChords,
    detectBeats,
    
    // Reset functions
    reset,
    resetTranscription,
    resetChords,
    resetBeats,
    
    // Helpers
    isLoading: 
      transcription.status === 'pending' || 
      transcription.status === 'processing' ||
      chords.status === 'pending' || 
      chords.status === 'processing' ||
      beats.status === 'pending' || 
      beats.status === 'processing',
  };
}
