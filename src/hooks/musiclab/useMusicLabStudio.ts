/**
 * useMusicLabStudio - Comprehensive hook for MusicLab functionality in Studio
 * Integrates vocal/guitar recording, chord detection, and PromptDJ
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useHaptic } from '@/hooks/useHaptic';
import { useRealtimeChordDetection } from '@/hooks/useRealtimeChordDetection';
import { usePromptDJ } from '@/hooks/usePromptDJ';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export type RecordingType = 'vocal' | 'guitar' | 'instrument';
export type MusicLabMode = 'record' | 'chords' | 'promptdj';

export interface RecordedTrack {
  id: string;
  audioUrl: string;
  type: RecordingType;
  duration: number;
  name: string;
  chords?: Array<{ chord: string; time: number }>;
  waveformData?: number[];
}

export interface MusicLabStats {
  totalRecordings: number;
  totalDuration: number;
  chordsDetected: number;
  djTracksGenerated: number;
}

interface UseMusicLabStudioOptions {
  projectId: string;
  onRecordingComplete?: (track: RecordedTrack) => void;
  onDJTrackGenerated?: (audioUrl: string) => void;
}

export function useMusicLabStudio(options: UseMusicLabStudioOptions) {
  const { projectId, onRecordingComplete, onDJTrackGenerated } = options;
  const { user } = useAuth();
  const haptic = useHaptic();
  
  // Active mode
  const [mode, setMode] = useState<MusicLabMode>('record');
  const [recordingType, setRecordingType] = useState<RecordingType>('vocal');
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Recorded tracks in session
  const [sessionRecordings, setSessionRecordings] = useState<RecordedTrack[]>([]);
  
  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelAnimationRef = useRef<number | null>(null);
  const detectedChordsRef = useRef<Array<{ chord: string; time: number }>>([]);
  
  // Chord detection
  const chordDetection = useRealtimeChordDetection({
    onChordChange: (chord) => {
      if (isRecording && recordingType === 'guitar') {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        detectedChordsRef.current.push({
          chord: chord.name,
          time: elapsed,
        });
        haptic.impact('medium');
      }
    },
    minConfidence: 0.5,
    stabilityFrames: 2,
  });
  
  // PromptDJ integration
  const promptDJ = usePromptDJ();
  
  // Statistics
  const stats = useMemo((): MusicLabStats => ({
    totalRecordings: sessionRecordings.length,
    totalDuration: sessionRecordings.reduce((sum, r) => sum + r.duration, 0),
    chordsDetected: detectedChordsRef.current.length,
    djTracksGenerated: promptDJ.generatedTracks.length,
  }), [sessionRecordings, promptDJ.generatedTracks.length]);
  
  // Audio level monitoring
  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(1, average / 128);
        setAudioLevel(normalized);
        
        levelAnimationRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (error) {
      logger.error('Audio level monitoring failed', error);
    }
  }, []);
  
  const stopAudioLevelMonitoring = useCallback(() => {
    if (levelAnimationRef.current) {
      cancelAnimationFrame(levelAnimationRef.current);
      levelAnimationRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);
  
  // Check microphone permission
  const checkPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch {
      setHasPermission(false);
      return false;
    }
  }, []);
  
  // Start recording
  const startRecording = useCallback(async () => {
    try {
      haptic.patterns.select();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: recordingType === 'vocal',
          noiseSuppression: recordingType === 'vocal',
          autoGainControl: false,
        },
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      detectedChordsRef.current = [];
      
      // Start audio level monitoring
      startAudioLevelMonitoring(stream);
      
      // Start chord detection for guitar
      if (recordingType === 'guitar') {
        chordDetection.startListening();
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration((Date.now() - startTimeRef.current) / 1000);
      }, 100);
      
      logger.info('Recording started', { type: recordingType, projectId });
      
    } catch (error) {
      logger.error('Failed to start recording', error);
      toast.error('Не удалось начать запись');
      haptic.patterns.error();
    }
  }, [recordingType, haptic, startAudioLevelMonitoring, chordDetection, projectId]);
  
  // Stop recording and upload
  const stopRecording = useCallback(async (): Promise<RecordedTrack | null> => {
    if (!mediaRecorderRef.current || !isRecording) return null;
    
    haptic.patterns.tap();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    stopAudioLevelMonitoring();
    
    if (recordingType === 'guitar') {
      chordDetection.stopListening();
    }
    
    setIsRecording(false);
    
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current!;
      
      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size < 1000) {
          toast.error('Запись слишком короткая');
          resolve(null);
          return;
        }
        
        setIsUploading(true);
        
        try {
          const fileName = `${user?.id}/${Date.now()}-${recordingType}.webm`;
          
          const { error: uploadError } = await supabase.storage
            .from('reference-audio')
            .upload(fileName, audioBlob, {
              contentType: 'audio/webm',
              upsert: false,
            });
          
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage
            .from('reference-audio')
            .getPublicUrl(fileName);
          
          const audioUrl = urlData.publicUrl;
          const duration = recordingDuration;
          
          const typeLabels: Record<RecordingType, string> = {
            vocal: 'Вокал',
            guitar: 'Гитара',
            instrument: 'Инструмент',
          };
          
          const track: RecordedTrack = {
            id: crypto.randomUUID(),
            audioUrl,
            type: recordingType,
            duration,
            name: `${typeLabels[recordingType]} (${formatDuration(duration)})`,
            chords: recordingType === 'guitar' ? [...detectedChordsRef.current] : undefined,
          };
          
          // Add to session recordings
          setSessionRecordings(prev => [...prev, track]);
          
          haptic.patterns.success();
          toast.success('Запись сохранена');
          
          onRecordingComplete?.(track);
          
          logger.info('Recording uploaded', { 
            type: recordingType, 
            duration, 
            chordsCount: detectedChordsRef.current.length 
          });
          
          resolve(track);
          
        } catch (error) {
          logger.error('Upload failed', error);
          toast.error('Ошибка загрузки записи');
          haptic.patterns.error();
          resolve(null);
        } finally {
          setIsUploading(false);
        }
      };
      
      recorder.stop();
    });
  }, [
    isRecording, recordingType, recordingDuration, user?.id,
    haptic, stopAudioLevelMonitoring, chordDetection, onRecordingComplete
  ]);
  
  // Cancel recording without saving
  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    
    stopAudioLevelMonitoring();
    
    if (recordingType === 'guitar') {
      chordDetection.stopListening();
    }
    
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
    detectedChordsRef.current = [];
    
    haptic.patterns.warning();
    toast.info('Запись отменена');
  }, [isRecording, recordingType, haptic, stopAudioLevelMonitoring, chordDetection]);
  
  // Generate with PromptDJ and add to project
  const generateWithDJ = useCallback(async () => {
    await promptDJ.generateMusic();
    
    // The latest track should be in generatedTracks after generation
    const latestTrack = promptDJ.generatedTracks[0];
    if (latestTrack?.audioUrl) {
      onDJTrackGenerated?.(latestTrack.audioUrl);
    }
  }, [promptDJ, onDJTrackGenerated]);
  
  // Remove session recording
  const removeSessionRecording = useCallback((id: string) => {
    setSessionRecordings(prev => prev.filter(r => r.id !== id));
  }, []);
  
  // Cleanup
  const cleanup = useCallback(() => {
    if (isRecording) {
      cancelRecording();
    }
    chordDetection.stopListening();
    promptDJ.stopPlayback();
    promptDJ.stopPreview();
  }, [isRecording, cancelRecording, chordDetection, promptDJ]);
  
  return {
    // Mode
    mode,
    setMode,
    recordingType,
    setRecordingType,
    
    // Recording state
    isRecording,
    isUploading,
    recordingDuration,
    audioLevel,
    hasPermission,
    
    // Recording actions
    checkPermission,
    startRecording,
    stopRecording,
    cancelRecording,
    
    // Session recordings
    sessionRecordings,
    removeSessionRecording,
    
    // Chord detection
    chordDetection: {
      currentChord: chordDetection.currentChord,
      chordHistory: chordDetection.chordHistory,
      chromagram: chordDetection.chromagram,
      isListening: chordDetection.isListening,
      isInitializing: chordDetection.isInitializing,
      error: chordDetection.error,
      volume: chordDetection.volume,
      startListening: chordDetection.startListening,
      stopListening: chordDetection.stopListening,
      clearHistory: chordDetection.clearHistory,
      exportProgression: chordDetection.exportProgression,
    },
    
    // PromptDJ
    promptDJ: {
      channels: promptDJ.channels,
      updateChannel: promptDJ.updateChannel,
      crossfaderPosition: promptDJ.crossfaderPosition,
      setCrossfaderPosition: promptDJ.setCrossfaderPosition,
      globalSettings: promptDJ.globalSettings,
      updateGlobalSettings: promptDJ.updateGlobalSettings,
      isGenerating: promptDJ.isGenerating,
      generatedTracks: promptDJ.generatedTracks,
      generateMusic: generateWithDJ,
      removeTrack: promptDJ.removeTrack,
      isPlaying: promptDJ.isPlaying,
      currentTrack: promptDJ.currentTrack,
      playTrack: promptDJ.playTrack,
      stopPlayback: promptDJ.stopPlayback,
      previewPrompt: promptDJ.previewPrompt,
      stopPreview: promptDJ.stopPreview,
      isPreviewPlaying: promptDJ.isPreviewPlaying,
      currentPrompt: promptDJ.currentPrompt,
    },
    
    // Stats
    stats,
    
    // Cleanup
    cleanup,
  };
}

// Helper function
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export type UseMusicLabStudioReturn = ReturnType<typeof useMusicLabStudio>;
