import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'MidiTranscription' });

// Duration threshold for switching between Klangio and Basic Pitch
// Klangio has a ~50 second limit on their basic tier
const KLANGIO_MAX_DURATION_SECONDS = 45;

export interface TranscriptionFiles {
  midi?: string;
  midi_quant?: string;
  mxml?: string;
  gp5?: string;
  pdf?: string;
}

interface TranscriptionResult {
  midiUrl: string;
  files: TranscriptionFiles;
  notes: Array<{
    pitch: number;
    startTime: number;
    endTime: number;
    duration: number;
    velocity: number;
    noteName?: string;
  }>;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  model: string;
  engine?: 'klangio' | 'basic-pitch';
}

interface UseKlangioTranscriptionReturn {
  transcribe: (audioUrl: string, options?: { 
    trackId?: string; 
    stemId?: string;
    model?: 'guitar' | 'piano' | 'drums' | 'vocal' | 'bass' | 'universal';
    outputs?: string[];
    durationSeconds?: number; // Audio duration for engine selection
    forceEngine?: 'klangio' | 'basic-pitch'; // Force specific engine
  }) => Promise<TranscriptionResult | null>;
  isLoading: boolean;
  error: string | null;
  result: TranscriptionResult | null;
  progress: number;
  currentEngine: 'klangio' | 'basic-pitch' | null;
}

export function useReplicateMidiTranscription(): UseKlangioTranscriptionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentEngine, setCurrentEngine] = useState<'klangio' | 'basic-pitch' | null>(null);

  const transcribe = useCallback(async (
    audioUrl: string,
    options?: { 
      trackId?: string; 
      stemId?: string;
      model?: 'guitar' | 'piano' | 'drums' | 'vocal' | 'bass' | 'universal';
      outputs?: string[];
      durationSeconds?: number;
      forceEngine?: 'klangio' | 'basic-pitch';
    }
  ): Promise<TranscriptionResult | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(10);

    try {
      // Determine which engine to use based on duration
      const duration = options?.durationSeconds;
      let engine: 'klangio' | 'basic-pitch' = 'klangio';
      
      if (options?.forceEngine) {
        engine = options.forceEngine;
      } else if (duration && duration > KLANGIO_MAX_DURATION_SECONDS) {
        engine = 'basic-pitch';
        log.info('Using Basic Pitch for long audio', { duration, threshold: KLANGIO_MAX_DURATION_SECONDS });
      }
      
      setCurrentEngine(engine);
      
      log.info('Starting MIDI transcription', { 
        audioUrl, 
        options, 
        engine,
        duration: duration || 'unknown'
      });

      if (engine === 'basic-pitch') {
        // Use Basic Pitch via Replicate for long audio (no duration limit)
        toast.info('Используется Basic Pitch для полной транскрипции', {
          description: 'Обработка длинного аудио может занять больше времени'
        });
        
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 2, 85));
        }, 5000);

        const { data, error: invokeError } = await supabase.functions.invoke('replicate-midi-transcription', {
          body: {
            audioUrl,
            trackId: options?.trackId,
            stemId: options?.stemId,
            model: 'basic-pitch',
          },
        });

        clearInterval(progressInterval);

        if (invokeError) {
          throw invokeError;
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Basic Pitch transcription failed');
        }

        setProgress(100);
        
        const transcriptionResult: TranscriptionResult = {
          midiUrl: data.midiUrl || data.files?.midi || '',
          files: data.files || { midi: data.midiUrl },
          notes: data.notes || [],
          model: 'basic-pitch',
          engine: 'basic-pitch',
        };

        setResult(transcriptionResult);
        
        log.info('Basic Pitch transcription completed', {
          midiUrl: transcriptionResult.midiUrl,
          notesCount: transcriptionResult.notes.length,
        });

        toast.success('Полная транскрипция завершена', {
          description: `Распознано ${transcriptionResult.notes.length} нот`
        });

        return transcriptionResult;
      } else {
        // Use Klangio for short audio (higher quality, more formats)
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 3, 85));
        }, 3000);

        const outputs = options?.outputs || ['midi', 'midi_quant', 'mxml', 'gp5', 'pdf'];

        const { data, error: invokeError } = await supabase.functions.invoke('klangio-analyze', {
          body: {
            audio_url: audioUrl,
            mode: 'transcription',
            model: options?.model || 'guitar',
            outputs,
            track_id: options?.trackId,
          },
        });

        clearInterval(progressInterval);

        if (invokeError) {
          throw invokeError;
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Transcription failed');
        }

        setProgress(100);
        
        const files: TranscriptionFiles = data.files || {};
        const hasAnyFile = Object.keys(files).length > 0;
        const hasMidi = !!files.midi;
        
        const transcriptionResult: TranscriptionResult = {
          midiUrl: files.midi || data.midi_url || '',
          files,
          notes: data.notes || [],
          bpm: data.bpm,
          key: data.key,
          timeSignature: data.time_signature,
          model: 'klangio',
          engine: 'klangio',
        };

        setResult(transcriptionResult);
        log.info('Klangio transcription completed', { 
          midiUrl: transcriptionResult.midiUrl,
          filesCount: Object.keys(files).length,
          notesCount: transcriptionResult.notes.length,
          hasMidi,
        });
        
        if (hasAnyFile) {
          if (hasMidi) {
            toast.success('Транскрипция завершена', {
              description: `Создано ${Object.keys(files).length} файлов`
            });
          } else {
            toast.warning('Частичная транскрипция', {
              description: 'MIDI не сгенерирован, но доступны ноты в PDF'
            });
          }
        } else {
          toast.error('Не удалось создать файлы транскрипции');
        }

        return transcriptionResult;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      log.error('MIDI transcription error', { error: errorMessage });
      setError(errorMessage);
      toast.error(`Ошибка транскрипции: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
      setCurrentEngine(null);
    }
  }, []);

  return {
    transcribe,
    isLoading,
    error,
    result,
    progress,
    currentEngine,
  };
}
