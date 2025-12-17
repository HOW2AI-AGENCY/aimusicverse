/**
 * Unified Audio Reference Hook
 * Single hook for all audio reference operations across the app
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useReferenceAudio, ReferenceAudio } from '@/hooks/useReferenceAudio';
import { 
  ReferenceManager, 
  UnifiedAudioReference, 
  ReferenceMode,
  AudioAnalysis 
} from '@/services/audio-reference';
import { logger } from '@/lib/logger';

export interface UseAudioReferenceReturn {
  // Current state
  activeReference: UnifiedAudioReference | null;
  recentReferences: ReferenceAudio[];
  isLoading: boolean;
  
  // Actions - from various sources
  setFromUpload: (file: File, mode?: ReferenceMode) => Promise<void>;
  setFromRecording: (blob: Blob, fileName?: string, mode?: ReferenceMode) => Promise<void>;
  setFromCloud: (audio: ReferenceAudio, mode?: ReferenceMode) => void;
  setFromStem: (data: {
    audioUrl: string;
    stemType: string;
    trackId?: string;
    trackTitle?: string;
    lyrics?: string;
    style?: string;
    action?: string;
  }, mode?: ReferenceMode) => void;
  setFromCreativeTool: (
    source: 'drums' | 'dj',
    audioUrl: string,
    options?: { prompt?: string; tags?: string; bpm?: number }
  ) => void;
  setFromGuitar: (data: {
    audioUrl: string;
    bpm?: number;
    chordProgression?: string[];
    styleDescription?: string;
    tags?: string[];
  }) => void;
  setFromTrack: (track: {
    id: string;
    audioUrl: string;
    title?: string;
    lyrics?: string;
    style?: string;
    duration?: number;
  }, mode?: ReferenceMode) => void;
  
  // Reference management
  clearActive: () => void;
  updateAnalysis: (analysis: AudioAnalysis) => void;
  persistReference: () => Promise<string | null>;
  
  // Navigation helpers
  navigateToGenerate: (mode?: ReferenceMode) => void;
  
  // Derived data
  hasAnalysis: boolean;
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed' | null;
}

export function useAudioReference(): UseAudioReferenceReturn {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { audioList, isLoading: isLoadingHistory } = useReferenceAudio();
  
  const [activeReference, setActiveReference] = useState<UnifiedAudioReference | null>(
    () => ReferenceManager.getActive()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to reference changes
  useEffect(() => {
    const unsubscribe = ReferenceManager.subscribe(setActiveReference);
    return unsubscribe;
  }, []);

  // Set from file upload
  const setFromUpload = useCallback(async (file: File, mode?: ReferenceMode) => {
    setIsLoading(true);
    try {
      await ReferenceManager.createFromUpload(file, mode);
      toast.success('Аудио загружено', {
        description: file.name,
      });
    } catch (error) {
      logger.error('Failed to set reference from upload', { error });
      toast.error('Ошибка загрузки аудио');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set from recording
  const setFromRecording = useCallback(async (
    blob: Blob, 
    fileName?: string, 
    mode?: ReferenceMode
  ) => {
    setIsLoading(true);
    try {
      await ReferenceManager.createFromRecording(blob, fileName, mode);
      toast.success('Запись сохранена');
    } catch (error) {
      logger.error('Failed to set reference from recording', { error });
      toast.error('Ошибка сохранения записи');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set from cloud (reference_audio table)
  const setFromCloud = useCallback((audio: ReferenceAudio, mode?: ReferenceMode) => {
    ReferenceManager.createFromCloud({
      id: audio.id,
      fileUrl: audio.file_url,
      fileName: audio.file_name,
      fileSize: audio.file_size || undefined,
      mimeType: audio.mime_type || undefined,
      durationSeconds: audio.duration_seconds || undefined,
      genre: audio.genre || undefined,
      mood: audio.mood || undefined,
      bpm: audio.bpm || undefined,
      tempo: audio.tempo || undefined,
      energy: audio.energy || undefined,
      vocalStyle: audio.vocal_style || undefined,
      styleDescription: audio.style_description || undefined,
      transcription: audio.transcription || undefined,
      instruments: audio.instruments || undefined,
    }, mode);

    const modeLabel = mode === 'cover' ? 'Кавер' : mode === 'extend' ? 'Расширение' : 'Референс';
    toast.success(`${modeLabel}: ${audio.file_name}`);
  }, []);

  // Set from stem studio
  const setFromStem = useCallback((data: {
    audioUrl: string;
    stemType: string;
    trackId?: string;
    trackTitle?: string;
    lyrics?: string;
    style?: string;
    action?: string;
  }, mode?: ReferenceMode) => {
    ReferenceManager.createFromStem(data, mode);
    toast.success('Референс из студии загружен');
  }, []);

  // Set from creative tools (drums, dj)
  const setFromCreativeTool = useCallback((
    source: 'drums' | 'dj',
    audioUrl: string,
    options?: { prompt?: string; tags?: string; bpm?: number }
  ) => {
    ReferenceManager.createFromCreativeTool(source, audioUrl, options);
    
    const sourceLabels: Record<string, string> = {
      drums: 'Drum Machine',
      dj: 'PromptDJ',
    };
    toast.success(`Референс из ${sourceLabels[source]} добавлен`);
  }, []);

  // Set from guitar analysis
  const setFromGuitar = useCallback((data: {
    audioUrl: string;
    bpm?: number;
    chordProgression?: string[];
    styleDescription?: string;
    tags?: string[];
  }) => {
    ReferenceManager.createFromGuitar(data);
    toast.success('Референс из гитары добавлен');
  }, []);

  // Set from existing track
  const setFromTrack = useCallback((track: {
    id: string;
    audioUrl: string;
    title?: string;
    lyrics?: string;
    style?: string;
    duration?: number;
  }, mode?: ReferenceMode) => {
    ReferenceManager.createFromTrack(track, mode);
    toast.success(`Трек "${track.title || 'Без названия'}" как референс`);
  }, []);

  // Clear active reference
  const clearActive = useCallback(() => {
    ReferenceManager.clearActive();
  }, []);

  // Update analysis
  const updateAnalysis = useCallback((analysis: AudioAnalysis) => {
    ReferenceManager.updateAnalysis(analysis);
  }, []);

  // Persist to database
  const persistReference = useCallback(async (): Promise<string | null> => {
    if (!user) {
      toast.error('Необходима авторизация');
      return null;
    }
    return ReferenceManager.persistToDatabase(user.id);
  }, [user]);

  // Navigate to generate page with reference
  const navigateToGenerate = useCallback((mode?: ReferenceMode) => {
    if (activeReference && mode) {
      // Update mode if specified
      ReferenceManager.setActive({ ...activeReference, intendedMode: mode });
    }
    navigate('/', { state: { openGenerate: true } });
  }, [navigate, activeReference]);

  // Derived state
  const hasAnalysis = !!activeReference?.analysis && 
    activeReference.analysisStatus === 'completed';
  
  const analysisStatus = activeReference?.analysisStatus || null;

  // Recent references from database
  const recentReferences = audioList.slice(0, 10);

  return {
    activeReference,
    recentReferences,
    isLoading: isLoading || isLoadingHistory,
    
    setFromUpload,
    setFromRecording,
    setFromCloud,
    setFromStem,
    setFromCreativeTool,
    setFromGuitar,
    setFromTrack,
    
    clearActive,
    updateAnalysis,
    persistReference,
    navigateToGenerate,
    
    hasAnalysis,
    analysisStatus,
  };
}
