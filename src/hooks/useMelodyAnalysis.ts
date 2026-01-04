import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import * as analysisService from '@/services/analysis.service';
import * as analysisApi from '@/api/analysis.api';
import type { NoteData, ChordData, MelodyAnalysisResult } from '@/services/analysis.service';

const log = logger.child({ module: 'MelodyAnalysis' });

export type { NoteData, ChordData, MelodyAnalysisResult };

export function useMelodyAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MelodyAnalysisResult | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `melody-${Date.now()}.webm`, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        setRecordedAudioUrl(url);
        setRecordedFile(file);
        toast.success('Запись завершена');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      toast.success('Запись началась - играйте мелодию!');
    } catch (error) {
      log.error('Microphone access error', error);
      toast.error('Нет доступа к микрофону');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    }
  }, [isRecording]);

  const analyzeRecordedAudio = useCallback(async (file?: File) => {
    const audioFile = file || recordedFile;
    if (!audioFile) {
      toast.error('Сначала запишите аудио');
      return null;
    }

    setIsAnalyzing(true);
    
    try {
      log.info('Starting melody analysis');
      
      // Get user
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      toast.info('Анализируем мелодию...');

      // Use service for analysis
      const result = await analysisService.analyzeAudioFile(audioFile, user.id);
      
      setAnalysisResult(result);
      toast.success('Анализ завершен!');
      
      log.info('Melody analysis complete', { 
        key: result.key, 
        bpm: result.bpm, 
        chordsCount: result.chords.length 
      });
      
      return result;
    } catch (error) {
      log.error('Melody analysis error', error);
      toast.error('Ошибка анализа мелодии');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [recordedFile]);

  const clearRecording = useCallback(() => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
    setRecordedFile(null);
    setAnalysisResult(null);
  }, [recordedAudioUrl]);

  return {
    isAnalyzing,
    isRecording,
    analysisResult,
    recordedAudioUrl,
    recordedFile,
    startRecording,
    stopRecording,
    analyzeRecordedAudio,
    clearRecording,
  };
}
