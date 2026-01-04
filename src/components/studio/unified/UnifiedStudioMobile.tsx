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

import { memo, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnifiedDAWLayout } from './UnifiedDAWLayout';
import { useUnifiedStudio } from '@/hooks/studio/useUnifiedStudio';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { registerStudioAudio, unregisterStudioAudio } from '@/hooks/studio/useStudioAudio';
import { studioProjectToDAWProject } from '@/lib/studio/typeAdapters';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

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

  // Convert StudioProject to DAWProject format
  const dawProject = useMemo(() => {
    if (!project) return null;
    return studioProjectToDAWProject(project);
  }, [project]);

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
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Default: navigate back
      navigate(-1);
    }
  };

  // Handle track actions
  const handleTrackAction = (trackId: string, action: string) => {
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
  };

  // Handle add track
  const handleAddTrack = () => {
    // TODO: Open add track dialog/sheet
    logger.info('[UnifiedStudioMobile] Add track requested');
  };

  // Handle export
  const handleExport = () => {
    // TODO: Open export dialog
    logger.info('[UnifiedStudioMobile] Export requested');
  };

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
            Loading studio...
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
            Failed to load {mode}. Please try again.
          </AlertDescription>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleClose} variant="outline" size="sm">
              Go Back
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="default" 
              size="sm"
            >
              Reload
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  // Main studio interface - Unified DAW layout (NO tabs)
  return (
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
        onPlayPause={isPlaying ? pause : play}
        onSeek={seek}
        onStop={stop}
        onMasterVolumeChange={setMasterVolume}
        onTrackMuteToggle={(trackId) => toggleMute(trackId)}
        onTrackSoloToggle={(trackId) => toggleSolo(trackId)}
        onTrackVolumeChange={(trackId, volume) => setVolume(trackId, volume)}
        onTrackPanChange={(trackId, pan) => setPan(trackId, pan)}
        onTrackRemove={(trackId) => removeTrack(trackId)}
        onAddTrack={handleAddTrack}
        onExport={handleExport}
        onSave={save}
      />
    </div>
  );
});

// Display name for React DevTools
UnifiedStudioMobile.displayName = 'UnifiedStudioMobile';
