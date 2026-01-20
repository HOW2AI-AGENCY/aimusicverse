/**
 * UnifiedStudioMobile - Root container for mobile studio
 * T009 [US1] - Phase 2.1 Foundation & Layout
 * 
 * Main entry point for the Unified Studio Mobile (DAW Canvas) experience.
 * Business logic delegated to useStudioHandlers hook.
 * Dialogs extracted to StudioDialogs component.
 * 
 * @see src/hooks/studio/useStudioHandlers.ts
 * @see src/components/studio/unified/StudioDialogs.tsx
 */

import { memo, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnifiedDAWLayout } from './UnifiedDAWLayout';
import { StudioDialogs } from './StudioDialogs';
import { useUnifiedStudio } from '@/hooks/studio/useUnifiedStudio';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useStudioOperationLock } from '@/hooks/studio/useStudioOperationLock';
import { useStemSeparation } from '@/hooks/useStemSeparation';
import { useStudioModals, useStudioModalHandlers } from '@/hooks/studio/useStudioModals';
import { useStudioHandlers } from '@/hooks/studio/useStudioHandlers';
import { registerStudioAudio, unregisterStudioAudio } from '@/hooks/studio/useStudioAudio';
import { studioProjectToDAWProject } from '@/lib/studio/typeAdapters';
import { useHaptic } from '@/hooks/useHaptic';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface UnifiedStudioMobileProps {
  trackId?: string;
  projectId?: string;
  mode: 'track' | 'project';
  onClose?: () => void;
  className?: string;
}

export const UnifiedStudioMobile = memo(function UnifiedStudioMobile({
  trackId,
  projectId,
  mode,
  onClose,
  className,
}: UnifiedStudioMobileProps) {
  const navigate = useNavigate();
  const id = mode === 'track' ? trackId : projectId;
  
  if (!id) {
    throw new Error(`UnifiedStudioMobile: ${mode} mode requires ${mode}Id prop`);
  }

  // Core studio hook
  const studio = useUnifiedStudio({ mode, id });
  const { patterns } = useHaptic();

  // Modal state machine
  const modals = useStudioModals();
  const modalHandlers = useStudioModalHandlers(modals, patterns.select);

  // Operation lock
  const operationLock = useStudioOperationLock(studio.project);

  // Stem separation
  const { separate, isSeparating } = useStemSeparation();

  // Get main track for AI actions
  const mainTrack = studio.tracks.find(t => t.type === 'main') || studio.tracks[0];
  const mainTrackUrl = mainTrack?.audioUrl || '';
  const mainTrackTitle = studio.project?.name || 'Track';
  
  // Track object for separation
  const trackForSeparation = useMemo(() => {
    if (!mainTrack) return null;
    return {
      id: mainTrack.id,
      audio_url: mainTrackUrl,
      suno_id: (mainTrack as any).sunoId || null,
      suno_task_id: (mainTrack as any).sunoTaskId || null,
      title: mainTrackTitle,
    };
  }, [mainTrack, mainTrackUrl, mainTrackTitle]);

  // Centralized handlers
  const handlers = useStudioHandlers({
    id,
    patterns,
    operationLock,
    modals,
    modalHandlers,
    studioActions: {
      toggleMute: studio.toggleMute,
      toggleSolo: studio.toggleSolo,
      removeTrack: studio.removeTrack,
      save: studio.save,
      play: studio.play,
      pause: studio.pause,
      seek: studio.seek,
      isPlaying: studio.isPlaying,
    },
    trackForSeparation,
    separate,
  });

  // Convert to DAW format
  const dawProject = useMemo(() => {
    if (!studio.project) return null;
    return studioProjectToDAWProject(studio.project);
  }, [studio.project]);

  // Audio engine registration
  useEffect(() => {
    const engineId = `unified-studio-${id}`;
    registerStudioAudio(engineId, () => {
      studio.pause();
      studio.stop();
    });
    
    logger.info('[UnifiedStudioMobile] Registered audio engine', { mode, id, engineId });

    return () => {
      unregisterStudioAudio(engineId);
      studio.stop();
      logger.info('[UnifiedStudioMobile] Unregistered audio engine', { engineId });
    };
  }, [id, mode, studio.stop, studio.pause]);

  // Close handler
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  }, [onClose, navigate]);

  // Version saved callback
  const handleVersionSaved = useCallback(() => {
    patterns.success();
    toast.success('Версия сохранена');
    modals.close();
  }, [patterns, modals]);

  // Loading state
  if (studio.isLoading) {
    return (
      <div 
        className={cn('flex h-screen w-full items-center justify-center bg-background', className)}
        data-testid="studio-loading"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Загрузка студии...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!dawProject) {
    return (
      <div 
        className={cn('flex h-screen w-full items-center justify-center p-4', className)}
        data-testid="studio-error"
      >
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Не удалось загрузить {mode === 'track' ? 'трек' : 'проект'}. Попробуйте снова.
          </AlertDescription>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleClose} variant="outline" size="sm">Назад</Button>
            <Button onClick={() => window.location.reload()} variant="default" size="sm">
              Перезагрузить
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn('h-screen w-full bg-background', className)}
        data-testid="unified-studio-mobile"
        role="main"
        aria-label="Music Studio"
      >
        <UnifiedDAWLayout
          project={dawProject}
          isPlaying={studio.isPlaying}
          currentTime={studio.currentTime}
          duration={studio.duration}
          onPlayPause={handlers.handlePlayPause}
          onSeek={handlers.handleSeek}
          onStop={studio.stop}
          onMasterVolumeChange={studio.setMasterVolume}
          onTrackMuteToggle={(trackId) => { patterns.tap(); studio.toggleMute(trackId); }}
          onTrackSoloToggle={(trackId) => { patterns.tap(); studio.toggleSolo(trackId); }}
          onTrackVolumeChange={(trackId, volume) => studio.setVolume(trackId, volume)}
          onTrackPanChange={(trackId, pan) => studio.setPan(trackId, pan)}
          onTrackRemove={(trackId) => studio.removeTrack(trackId)}
          onAddTrack={modalHandlers.openAddTrack}
          onExport={modalHandlers.openExport}
          onSave={handlers.handleSave}
          onUndo={studio.undo}
          onRedo={studio.redo}
          canUndo={studio.canUndo}
          canRedo={studio.canRedo}
          onGenerate={handlers.handleGenerate}
          onExtend={handlers.handleExtend}
          onCover={handlers.handleCover}
          onAddVocals={handlers.handleAddVocals}
          onSeparateStems={handlers.handleSeparateStems}
          onSaveAsVersion={operationLock.canSaveAsNewVersion ? modalHandlers.openSaveVersion : undefined}
          onRecord={modalHandlers.openRecord}
          onAddInstrumental={handlers.handleAddInstrumental}
          hasStems={operationLock.hasStems}
          hasPendingTracks={operationLock.hasPendingTracks}
        />
      </div>

      <StudioDialogs
        id={id}
        projectId={studio.project?.id || id}
        mainTrackUrl={mainTrackUrl}
        mainTrackTitle={mainTrackTitle}
        mainTrack={mainTrack}
        trackForSeparation={trackForSeparation}
        tracks={studio.tracks}
        masterVolume={studio.masterVolume}
        currentTime={studio.currentTime}
        duration={studio.duration}
        isPlaying={studio.isPlaying}
        isSeparating={isSeparating}
        modals={modals}
        onStemSeparationConfirm={handlers.handleStemSeparationConfirm}
        onRecordingComplete={handlers.handleRecordingComplete}
        onVersionSaved={handleVersionSaved}
        onSeek={handlers.handleSeek}
      />
    </>
  );
});

UnifiedStudioMobile.displayName = 'UnifiedStudioMobile';
