/**
 * UnifiedStudioMobile - Root container for mobile studio
 * T009 [US1] - Phase 2.1 Foundation & Layout
 * 
 * Main entry point for the Unified Studio Mobile (DAW Canvas) experience.
 * Integrates all mobile studio components with:
 * - UNIFIED DAW-like interface (NO tabs - all in one view)
 * - Timeline ruler, track lanes, transport controls
 * - Mobile-first gestures and touch optimization
 * - Unified hook API for consistent state management
 * - Telegram haptic feedback
 * - Floating AI actions button (FAB)
 * 
 * @see ADR-011 for architecture decisions (line 278: "Вместо табов реализуем единый DAW-подобный интерфейс")
 * @see specs/001-unified-studio-mobile/plan.md for implementation plan
 */

import { memo, useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { UnifiedDAWLayout } from './UnifiedDAWLayout';
import { AddTrackDrawer } from './AddTrackDrawer';
import { ExportMixDialog } from './ExportMixDialog';
import { SaveVersionDialog } from './SaveVersionDialog';
import { StemSeparationModeDialog } from '@/components/stem-studio/StemSeparationModeDialog';
import { ExtendDialog } from '@/components/stem-studio/ExtendDialog';
import { RemixDialog } from '@/components/stem-studio/RemixDialog';
import { LazyAddVocalsDrawer } from '@/components/lazy';
import { RecordTrackDrawer, RecordingType } from './RecordTrackDrawer';
import { useUnifiedStudio } from '@/hooks/studio/useUnifiedStudio';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useStudioOperationLock } from '@/hooks/studio/useStudioOperationLock';
import { useStemSeparation } from '@/hooks/useStemSeparation';
import { registerStudioAudio, unregisterStudioAudio } from '@/hooks/studio/useStudioAudio';
import { studioProjectToDAWProject } from '@/lib/studio/typeAdapters';
import { useHaptic } from '@/hooks/useHaptic';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedStudioMobileProps {
  /** Track ID for track mode */
  trackId?: string;
  /** Project ID for project mode */
  projectId?: string;
  /** Operating mode */
  mode: 'track' | 'project';
  /** Callback when studio closes */
  onClose?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * UnifiedStudioMobile - Mobile-optimized studio container
 * 
 * Provides single-window DAW interface WITHOUT TABS:
 * - Timeline ruler at top
 * - Track lanes in middle (vertically stacked with waveforms)
 * - Transport controls at bottom
 * - Floating AI actions button (FAB)
 * - Collapsible mixer panel (slide from right)
 * - Touch-optimized gestures (pinch-zoom on timeline, tap-to-seek)
 * - Haptic feedback (Telegram integration)
 * - Real-time audio playback
 * 
 * NO tab navigation - everything visible in one view.
 * 
 * Usage:
 * ```tsx
 * // Track mode
 * <UnifiedStudioMobile trackId="track-123" mode="track" />
 * 
 * // Project mode
 * <UnifiedStudioMobile projectId="project-456" mode="project" />
 * ```
 */
export const UnifiedStudioMobile = memo(function UnifiedStudioMobile({
  trackId,
  projectId,
  mode,
  onClose,
  className,
}: UnifiedStudioMobileProps) {
  const navigate = useNavigate();
  
  // Validation: require appropriate ID for mode
  const id = mode === 'track' ? trackId : projectId;
  if (!id) {
    throw new Error(
      `UnifiedStudioMobile: ${mode} mode requires ${mode}Id prop`
    );
  }

  // Unified studio hook - provides complete API
  const {
    project,
    tracks,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    isPlaying,
    currentTime,
    duration,
    masterVolume,
    play,
    pause,
    stop,
    seek,
    setMasterVolume,
    toggleMute,
    toggleSolo,
    setVolume,
    setPan,
    removeTrack,
    reorderTracks,
    canUndo,
    canRedo,
    undo,
    redo,
    save,
  } = useUnifiedStudio({ mode, id });

  // Haptic feedback
  const { patterns } = useHaptic();

  // Operation lock - determines what AI actions are available
  const operationLock = useStudioOperationLock(project);

  // Query client for invalidations
  const queryClient = useQueryClient();

  // Stem separation hook
  const { separate, isSeparating } = useStemSeparation();

  // UI State - Dialogs
  const [showAddTrackDrawer, setShowAddTrackDrawer] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSaveVersionDialog, setShowSaveVersionDialog] = useState(false);
  const [showStemDialog, setShowStemDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showRemixDialog, setShowRemixDialog] = useState(false);
  const [showAddVocalsDrawer, setShowAddVocalsDrawer] = useState(false);
  const [showRecordDrawer, setShowRecordDrawer] = useState(false);

  // Convert StudioProject to DAWProject format
  const dawProject = useMemo(() => {
    if (!project) return null;
    return studioProjectToDAWProject(project);
  }, [project]);

  // Get main track for AI actions
  const mainTrack = tracks.find(t => t.type === 'main') || tracks[0];
  const mainTrackUrl = mainTrack?.audioUrl || '';
  const mainTrackTitle = project?.name || 'Track';
  
  // Create a Track-like object for useStemSeparation
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

  // Audio engine registration
  const { activeTrack: globalPlayingTrack } = usePlayerStore();
  
  useEffect(() => {
    // Register studio audio with global audio manager
    const engineId = `unified-studio-${id}`;
    registerStudioAudio(engineId, () => {
      pause();
      stop();
    });
    
    logger.info('[UnifiedStudioMobile] Registered audio engine', {
      mode,
      id,
      engineId,
    });

    return () => {
      // Cleanup: unregister and stop playback
      unregisterStudioAudio(engineId);
      stop();
      
      logger.info('[UnifiedStudioMobile] Unregistered audio engine', {
        engineId,
      });
    };
  }, [id, mode, stop, pause]);

  // Handle close navigation
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  }, [onClose, navigate]);

  // Handle track actions with haptic feedback
  const handleTrackAction = useCallback((trackId: string, action: string) => {
    patterns.tap();
    switch (action) {
      case 'mute':
        toggleMute(trackId);
        break;
      case 'solo':
        toggleSolo(trackId);
        break;
      case 'remove':
        removeTrack(trackId);
        break;
      default:
        logger.warn('[UnifiedStudioMobile] Unknown track action', { action });
    }
  }, [toggleMute, toggleSolo, removeTrack, patterns]);

  // Handle add track
  const handleAddTrack = useCallback(() => {
    patterns.select();
    setShowAddTrackDrawer(true);
    logger.info('[UnifiedStudioMobile] Add track drawer opened');
  }, [patterns]);

  // Handle export
  const handleExport = useCallback(() => {
    patterns.select();
    setShowExportDialog(true);
    logger.info('[UnifiedStudioMobile] Export dialog opened');
  }, [patterns]);

  // Handle save with haptic feedback
  const handleSave = useCallback(async () => {
    patterns.tap();
    const success = await save();
    if (success) {
      patterns.success();
      toast.success('Проект сохранён');
    } else {
      patterns.error();
      toast.error('Ошибка сохранения');
    }
    return success;
  }, [save, patterns]);

  // AI Actions handlers
  const handleGenerate = useCallback(() => {
    patterns.select();
    toast.info('Генерация нового трека');
    // TODO: Open generate sheet
  }, [patterns]);

  const handleExtend = useCallback(() => {
    if (!operationLock.isOperationAllowed('extend')) {
      const reason = operationLock.getBlockReason('extend');
      patterns.error();
      toast.warning(reason || 'Операция недоступна');
      return;
    }
    patterns.select();
    setShowExtendDialog(true);
  }, [operationLock, patterns]);

  const handleCover = useCallback(() => {
    if (!operationLock.isOperationAllowed('cover')) {
      const reason = operationLock.getBlockReason('cover');
      patterns.error();
      toast.warning(reason || 'Операция недоступна');
      return;
    }
    patterns.select();
    setShowRemixDialog(true);
  }, [operationLock, patterns]);

  const handleAddVocals = useCallback(() => {
    if (!operationLock.isOperationAllowed('add_vocals')) {
      const reason = operationLock.getBlockReason('add_vocals');
      patterns.error();
      toast.warning(reason || 'Операция недоступна');
      return;
    }
    patterns.select();
    setShowAddVocalsDrawer(true);
  }, [operationLock, patterns]);

  const handleSeparateStems = useCallback(() => {
    if (!operationLock.isOperationAllowed('separate_stems')) {
      const reason = operationLock.getBlockReason('separate_stems');
      patterns.error();
      toast.warning(reason || 'Операция недоступна');
      return;
    }
    patterns.select();
    setShowStemDialog(true);
  }, [operationLock, patterns]);

  // Handle stem separation confirmation
  const handleStemSeparationConfirm = useCallback(async (mode: 'simple' | 'detailed') => {
    if (!trackForSeparation?.suno_id) {
      toast.error('Не удалось найти данные трека для разделения');
      setShowStemDialog(false);
      return;
    }
    
    try {
      await separate(trackForSeparation as any, mode);
      setShowStemDialog(false);
      queryClient.invalidateQueries({ queryKey: ['track-stems', id] });
    } catch (error) {
      logger.error('Stem separation failed', error);
    }
  }, [trackForSeparation, separate, id, queryClient]);

  const handleSaveAsVersion = useCallback(() => {
    patterns.select();
    setShowSaveVersionDialog(true);
  }, [patterns]);

  // Handle record action
  const handleRecord = useCallback(() => {
    patterns.select();
    setShowRecordDrawer(true);
    logger.info('[UnifiedStudioMobile] Record drawer opened');
  }, [patterns]);

  // Handle recording complete
  const handleRecordingComplete = useCallback((recordedTrack: any) => {
    patterns.success();
    toast.success('Запись добавлена');
    logger.info('[UnifiedStudioMobile] Recording complete', { 
      type: recordedTrack.type, 
      duration: recordedTrack.duration 
    });
    // TODO: Add track to project
    queryClient.invalidateQueries({ queryKey: ['track', id] });
  }, [patterns, queryClient, id]);

  // Play/pause with haptic
  const handlePlayPause = useCallback(() => {
    patterns.tap();
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause, patterns]);

  // Seek with haptic
  const handleSeek = useCallback((time: number) => {
    seek(time);
  }, [seek]);

  // Prepare export tracks data
  const exportTracks = useMemo(() => {
    return tracks.map(t => ({
      url: t.audioUrl || '',
      volume: t.volume,
      muted: t.muted,
    }));
  }, [tracks]);

  // Loading state
  if (isLoading) {
    return (
      <div 
        className={cn(
          'flex h-screen w-full items-center justify-center bg-background',
          className
        )}
        data-testid="studio-loading"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Загрузка студии...
          </p>
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
            <Button onClick={handleClose} variant="outline" size="sm">
              Назад
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="default" 
              size="sm"
            >
              Перезагрузить
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  // Main studio interface - Unified DAW layout (NO tabs)
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
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onStop={stop}
          onMasterVolumeChange={setMasterVolume}
          onTrackMuteToggle={(trackId) => {
            patterns.tap();
            toggleMute(trackId);
          }}
          onTrackSoloToggle={(trackId) => {
            patterns.tap();
            toggleSolo(trackId);
          }}
          onTrackVolumeChange={(trackId, volume) => setVolume(trackId, volume)}
          onTrackPanChange={(trackId, pan) => setPan(trackId, pan)}
          onTrackRemove={(trackId) => removeTrack(trackId)}
          onAddTrack={handleAddTrack}
          onExport={handleExport}
          onSave={handleSave}
          // Undo/Redo
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          // AI Actions
          onGenerate={handleGenerate}
          onExtend={handleExtend}
          onCover={handleCover}
          onAddVocals={handleAddVocals}
          onSeparateStems={handleSeparateStems}
          onSaveAsVersion={operationLock.canSaveAsNewVersion ? handleSaveAsVersion : undefined}
          onRecord={handleRecord}
          // Operation lock state
          hasStems={operationLock.hasStems}
          hasPendingTracks={operationLock.hasPendingTracks}
        />
      </div>

      {/* Add Track Drawer */}
      <AddTrackDrawer
        open={showAddTrackDrawer}
        onOpenChange={setShowAddTrackDrawer}
        trackId={id}
        trackUrl={mainTrackUrl}
        trackTitle={mainTrackTitle}
      />

      {/* Export Dialog */}
      <ExportMixDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        tracks={exportTracks}
        masterVolume={masterVolume}
        trackTitle={mainTrackTitle}
      />

      {/* Save Version Dialog */}
      <SaveVersionDialog
        open={showSaveVersionDialog}
        onOpenChange={setShowSaveVersionDialog}
        projectId={project?.id || id}
        sourceTrackId={id}
        tracks={tracks}
        masterVolume={masterVolume}
        onVersionSaved={() => {
          patterns.success();
          toast.success('Версия сохранена');
          setShowSaveVersionDialog(false);
        }}
      />

      {/* Stem Separation Dialog */}
      <StemSeparationModeDialog
        open={showStemDialog}
        onOpenChange={setShowStemDialog}
        onConfirm={handleStemSeparationConfirm}
        isProcessing={isSeparating}
      />

      {/* Extend Dialog */}
      {mainTrack && trackForSeparation && (
        <ExtendDialog
          open={showExtendDialog}
          onOpenChange={setShowExtendDialog}
          track={trackForSeparation as any}
        />
      )}

      {/* Remix/Cover Dialog */}
      {mainTrack && trackForSeparation && (
        <RemixDialog
          open={showRemixDialog}
          onOpenChange={setShowRemixDialog}
          track={trackForSeparation as any}
        />
      )}

      {/* Add Vocals Drawer */}
      {mainTrack && trackForSeparation && (
        <LazyAddVocalsDrawer
          open={showAddVocalsDrawer}
          onOpenChange={setShowAddVocalsDrawer}
          track={trackForSeparation as any}
        />
      )}

      {/* Record Track Drawer */}
      <RecordTrackDrawer
        open={showRecordDrawer}
        onOpenChange={setShowRecordDrawer}
        projectId={project?.id || id}
        onRecordingComplete={handleRecordingComplete}
      />
    </>
  );
});

// Display name for React DevTools
UnifiedStudioMobile.displayName = 'UnifiedStudioMobile';
