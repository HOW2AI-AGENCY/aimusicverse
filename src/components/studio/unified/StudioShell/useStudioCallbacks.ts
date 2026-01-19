/**
 * useStudioCallbacks - Centralized callbacks for StudioShell
 * Extracted from StudioShell for better maintainability
 */

import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedStudioStore, TrackType, TRACK_COLORS, StudioTrack } from '@/stores/useUnifiedStudioStore';
import { useStemSeparation } from '@/hooks/useStemSeparation';
import { logger } from '@/lib/logger';
import type { Track } from '@/types/track';

interface UseStudioCallbacksProps {
  project: ReturnType<typeof useUnifiedStudioStore.getState>['project'];
  hasUnsavedChanges: boolean;
  sourceTrackId?: string;
  audioEngine: {
    isPlaying: boolean;
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
  };
  pauseGlobalPlayer: () => void;
}

export function useStudioCallbacks({
  project,
  hasUnsavedChanges,
  sourceTrackId,
  audioEngine,
  pauseGlobalPlayer,
}: UseStudioCallbacksProps) {
  const navigate = useNavigate();
  const { separate: separateStems, isSeparating } = useStemSeparation();
  
  const {
    saveProject,
    play,
    pause,
    seek,
    addTrack,
    addClip,
    setTrackActiveVersion,
    toggleTrackMute,
    toggleTrackSolo,
    setTrackVolume,
    removeTrack,
    setMasterVolume,
  } = useUnifiedStudioStore();

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      await saveProject();
      toast.success('Проект сохранён');
    } catch (error) {
      toast.error('Ошибка сохранения');
    }
  }, [saveProject]);

  // Handle back
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm('Есть несохранённые изменения. Выйти?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }, [hasUnsavedChanges, navigate]);

  // Handle add track
  const handleAddTrack = useCallback((type: TrackType, name: string) => {
    addTrack({
      name,
      type,
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      color: TRACK_COLORS[type],
    });
    toast.success(`Добавлена дорожка: ${name}`);
  }, [addTrack]);

  // Handle seek with audio engine sync
  const handleSeek = useCallback((time: number) => {
    audioEngine.seek(time);
    seek(time);
  }, [audioEngine, seek]);

  // Handle play/pause with global audio coordination
  const handlePlayPause = useCallback(() => {
    if (audioEngine.isPlaying) {
      audioEngine.pause();
      pause();
    } else {
      pauseGlobalPlayer();
      // pauseAllStudioAudio called from parent
      audioEngine.play();
      play();
    }
  }, [audioEngine, play, pause, pauseGlobalPlayer]);

  // Handle stem separation
  const handleStemSeparation = useCallback(async (mode: 'simple' | 'detailed') => {
    if (!sourceTrackId) {
      toast.error('Исходный трек не найден');
      return;
    }
    
    const { data: trackData, error } = await supabase
      .from('tracks')
      .select('id, title, audio_url, suno_id, suno_task_id')
      .eq('id', sourceTrackId)
      .maybeSingle();
    
    if (error || !trackData) {
      toast.error('Не удалось загрузить трек');
      return;
    }
    
    if (!trackData.suno_id || !trackData.audio_url) {
      toast.error('Трек не поддерживает разделение на стемы');
      return;
    }
    
    try {
      await separateStems(trackData as Track, mode);
    } catch (err) {
      logger.error('Stem separation failed', err);
    }
  }, [sourceTrackId, separateStems]);

  // Handle track actions from mobile UI
  const handleMobileTrackAction = useCallback((trackId: string, action: string) => {
    if (!project) return;
    
    const track = project.tracks.find(t => t.id === trackId);
    if (!track) return;

    switch (action) {
      case 'download':
        if (track.audioUrl) {
          window.open(track.audioUrl, '_blank');
        }
        break;
      case 'cover':
        if (track.audioUrl) {
          navigate(`/create?mode=cover&audioUrl=${encodeURIComponent(track.audioUrl)}`);
        } else {
          toast.error('Нет аудио для референса');
        }
        break;
      default:
        // Other actions are handled via dialog state setters in the component
        break;
    }
  }, [project, navigate]);

  // Map stem type to track type
  const mapStemTypeToTrackType = useCallback((stemType: string): TrackType => {
    const t = stemType.toLowerCase();
    if (t === 'vocals' || t === 'vocal') return 'vocal';
    if (t === 'instrumental') return 'instrumental';
    if (t === 'drums') return 'drums';
    if (t === 'bass') return 'bass';
    return 'other';
  }, []);

  const mapStemTypeToLabel = useCallback((stemType: string): string => {
    const t = stemType.toLowerCase();
    if (t === 'vocals' || t === 'vocal') return 'Вокал';
    if (t === 'instrumental') return 'Инструментал';
    if (t === 'drums') return 'Ударные';
    if (t === 'bass') return 'Бас';
    return 'Другое';
  }, []);

  // Add stem to project if missing
  const addStemToProjectIfMissing = useCallback((stem: { stem_type: string; audio_url: string }) => {
    const currentProject = useUnifiedStudioStore.getState().project;
    if (!currentProject) return;

    const alreadyExists = currentProject.tracks.some(
      t => (t.audioUrl || t.clips?.[0]?.audioUrl) === stem.audio_url
    );
    if (alreadyExists) return;

    const type = mapStemTypeToTrackType(stem.stem_type);
    const name = mapStemTypeToLabel(stem.stem_type);

    const newTrackId = addTrack({
      name,
      type,
      audioUrl: stem.audio_url,
      volume: 0.9,
      pan: 0,
      muted: false,
      solo: false,
      color: TRACK_COLORS[type] || TRACK_COLORS.other,
      status: 'ready',
    });

    addClip(newTrackId, {
      audioUrl: stem.audio_url,
      name,
      startTime: 0,
      duration: currentProject.durationSeconds || 180,
      trimStart: 0,
      trimEnd: 0,
      fadeIn: 0,
      fadeOut: 0,
    });
  }, [addTrack, addClip, mapStemTypeToTrackType, mapStemTypeToLabel]);

  return {
    handleSave,
    handleBack,
    handleAddTrack,
    handleSeek,
    handlePlayPause,
    handleStemSeparation,
    handleMobileTrackAction,
    addStemToProjectIfMissing,
    mapStemTypeToTrackType,
    mapStemTypeToLabel,
    isSeparating,
    toggleTrackMute,
    toggleTrackSolo,
    setTrackVolume,
    removeTrack,
    setMasterVolume,
    setTrackActiveVersion,
  };
}
