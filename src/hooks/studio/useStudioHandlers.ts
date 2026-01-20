/**
 * Studio Handlers Hook
 * 
 * Centralizes all callback handlers for studio operations:
 * - AI actions (extend, cover, add vocals, separate stems)
 * - Recording completion
 * - Track actions (mute, solo, remove)
 * - Save and export
 * 
 * @param options - Studio context and dependencies
 * @returns Memoized handlers for studio operations
 */

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { RecordingType } from '@/components/studio/unified/RecordTrackDrawer';
import type { StudioOperation } from '@/hooks/studio/useStudioOperationLock';

export interface StudioHandlersOptions {
  id: string;
  patterns: {
    tap: () => void;
    select: () => void;
    success: () => void;
    error: () => void;
  };
  operationLock: {
    isOperationAllowed: (op: StudioOperation) => boolean;
    getBlockReason: (op: StudioOperation) => string | null;
  };
  modals: {
    close: () => void;
  };
  modalHandlers: {
    openExtend: () => void;
    openRemix: () => void;
    openAddVocals: () => void;
    openStemSeparation: () => void;
    openAddInstrumental: () => void;
  };
  studioActions: {
    toggleMute: (trackId: string) => void;
    toggleSolo: (trackId: string) => void;
    removeTrack: (trackId: string) => void;
    save: () => Promise<boolean>;
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
    isPlaying: boolean;
  };
  trackForSeparation: {
    id: string;
    suno_id: string | null;
  } | null;
  separate: (track: any, mode: 'simple' | 'detailed') => Promise<void>;
}

export function useStudioHandlers(options: StudioHandlersOptions) {
  const {
    id,
    patterns,
    operationLock,
    modals,
    modalHandlers,
    studioActions,
    trackForSeparation,
    separate,
  } = options;

  const queryClient = useQueryClient();

  // AI Actions with operation lock checks
  const handleExtend = useCallback(() => {
    if (!operationLock.isOperationAllowed('extend')) {
      const reason = operationLock.getBlockReason('extend');
      patterns.error();
      toast.warning(reason || 'Операция недоступна');
      return;
    }
    modalHandlers.openExtend();
  }, [operationLock, patterns, modalHandlers]);

  const handleCover = useCallback(() => {
    if (!operationLock.isOperationAllowed('cover')) {
      const reason = operationLock.getBlockReason('cover');
      patterns.error();
      toast.warning(reason || 'Операция недоступна');
      return;
    }
    modalHandlers.openRemix();
  }, [operationLock, patterns, modalHandlers]);

  const handleAddVocals = useCallback(() => {
    if (!operationLock.isOperationAllowed('add_vocals')) {
      const reason = operationLock.getBlockReason('add_vocals');
      patterns.error();
      toast.warning(reason || 'Операция недоступна');
      return;
    }
    modalHandlers.openAddVocals();
  }, [operationLock, patterns, modalHandlers]);

  const handleSeparateStems = useCallback(() => {
    if (!operationLock.isOperationAllowed('separate_stems')) {
      const reason = operationLock.getBlockReason('separate_stems');
      patterns.error();
      toast.warning(reason || 'Операция недоступна');
      return;
    }
    modalHandlers.openStemSeparation();
  }, [operationLock, patterns, modalHandlers]);

  const handleAddInstrumental = useCallback(() => {
    if (!operationLock.isOperationAllowed('add_vocals')) {
      const reason = operationLock.getBlockReason('add_vocals');
      patterns.error();
      toast.warning(reason || 'Операция недоступна');
      return;
    }
    modalHandlers.openAddInstrumental();
  }, [operationLock, patterns, modalHandlers]);

  const handleGenerate = useCallback(() => {
    patterns.select();
    toast.info('Генерация нового трека');
    // TODO: Open generate sheet
  }, [patterns]);

  // Stem separation confirmation
  const handleStemSeparationConfirm = useCallback(async (stemMode: 'simple' | 'detailed') => {
    if (!trackForSeparation?.suno_id) {
      toast.error('Не удалось найти данные трека для разделения');
      modals.close();
      return;
    }
    
    try {
      await separate(trackForSeparation as any, stemMode);
      modals.close();
      queryClient.invalidateQueries({ queryKey: ['track-stems', id] });
    } catch (error) {
      logger.error('Stem separation failed', error);
    }
  }, [trackForSeparation, separate, id, queryClient, modals]);

  // Recording complete handler
  const handleRecordingComplete = useCallback(async (recordedTrack: {
    id: string;
    audioUrl: string;
    type: RecordingType;
    duration: number;
    name: string;
    chords?: Array<{ chord: string; time: number }>;
  }) => {
    patterns.success();
    logger.info('[StudioHandlers] Recording complete', { 
      type: recordedTrack.type, 
      duration: recordedTrack.duration 
    });
    
    try {
      const stemTypeMap: Record<RecordingType, string> = {
        vocal: 'vocals',
        guitar: 'guitar',
        instrument: 'other',
      };
      const stemType = stemTypeMap[recordedTrack.type] || 'other';
      
      const { error } = await supabase
        .from('track_stems')
        .insert({
          track_id: id,
          stem_type: stemType,
          audio_url: recordedTrack.audioUrl,
          duration: recordedTrack.duration,
          status: 'completed',
          metadata: recordedTrack.chords 
            ? { chords: recordedTrack.chords, name: recordedTrack.name }
            : { name: recordedTrack.name },
        });
      
      if (error) {
        logger.error('Failed to save recording to database', error);
        toast.error('Ошибка сохранения записи');
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['track', id] });
      queryClient.invalidateQueries({ queryKey: ['trackStems', id] });
      
      toast.success('Запись добавлена в проект');
    } catch (error) {
      logger.error('Failed to save recording', error);
      toast.error('Ошибка сохранения записи');
    }
    
    modals.close();
  }, [patterns, queryClient, id, modals]);

  // Track actions
  const handleTrackAction = useCallback((trackId: string, action: string) => {
    patterns.tap();
    switch (action) {
      case 'mute':
        studioActions.toggleMute(trackId);
        break;
      case 'solo':
        studioActions.toggleSolo(trackId);
        break;
      case 'remove':
        studioActions.removeTrack(trackId);
        break;
      default:
        logger.warn('[StudioHandlers] Unknown track action', { action });
    }
  }, [studioActions, patterns]);

  // Save with haptic
  const handleSave = useCallback(async () => {
    patterns.tap();
    const success = await studioActions.save();
    if (success) {
      patterns.success();
      toast.success('Проект сохранён');
    } else {
      patterns.error();
      toast.error('Ошибка сохранения');
    }
    return success;
  }, [studioActions, patterns]);

  // Play/pause with haptic
  const handlePlayPause = useCallback(() => {
    patterns.tap();
    if (studioActions.isPlaying) {
      studioActions.pause();
    } else {
      studioActions.play();
    }
  }, [studioActions, patterns]);

  // Seek
  const handleSeek = useCallback((time: number) => {
    studioActions.seek(time);
  }, [studioActions]);

  return useMemo(() => ({
    // AI Actions
    handleExtend,
    handleCover,
    handleAddVocals,
    handleSeparateStems,
    handleAddInstrumental,
    handleGenerate,
    handleStemSeparationConfirm,
    
    // Recording
    handleRecordingComplete,
    
    // Track actions
    handleTrackAction,
    
    // Transport
    handlePlayPause,
    handleSeek,
    handleSave,
  }), [
    handleExtend,
    handleCover,
    handleAddVocals,
    handleSeparateStems,
    handleAddInstrumental,
    handleGenerate,
    handleStemSeparationConfirm,
    handleRecordingComplete,
    handleTrackAction,
    handlePlayPause,
    handleSeek,
    handleSave,
  ]);
}
