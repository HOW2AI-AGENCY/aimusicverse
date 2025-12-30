import React, { useCallback, useEffect } from 'react';
import { CompactPlayer } from './CompactPlayer';
import { FullscreenPlayer } from './FullscreenPlayer';
import { ExpandedPlayer } from './player/ExpandedPlayer';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useMasterVersion } from '@/hooks/useTrackVersions';
import { getGlobalAudioRef } from '@/hooks/audio/useAudioTime';
import { AnimatePresence } from '@/lib/motion';
import { logger } from '@/lib/logger';

export const ResizablePlayer = () => {
  const { activeTrack, closePlayer, playerMode, setPlayerMode, preserveTime, volume } = usePlayerStore();
  
  // Fetch the primary version for correct lyrics synchronization
  const { data: currentVersion } = useMasterVersion(activeTrack?.id);

  // Preserve current time before mode switch to avoid audio restart
  const preserveCurrentTime = useCallback(() => {
    const audio = getGlobalAudioRef();
    if (audio && !isNaN(audio.currentTime) && audio.currentTime > 0) {
      logger.debug('Preserving playback time for mode switch', { time: audio.currentTime });
      preserveTime(audio.currentTime);
    }
  }, [preserveTime]);

  // Ensure audio context is ready when player mode changes
  useEffect(() => {
    if (playerMode === 'minimized' || !activeTrack) return;
    
    const ensureAudioReady = async () => {
      const audio = getGlobalAudioRef();
      if (!audio) return;
      
      try {
        const { resumeAudioContext, ensureAudioRoutedToDestination } = await import('@/lib/audioContextManager');
        await resumeAudioContext(2);
        await ensureAudioRoutedToDestination();
        
        // Sync volume
        if (audio.volume !== volume) {
          audio.volume = volume;
        }
      } catch (err) {
        logger.warn('Error ensuring audio on mode change');
      }
    };
    
    // Small delay to let new component mount
    const timer = setTimeout(ensureAudioReady, 100);
    return () => clearTimeout(timer);
  }, [playerMode, activeTrack, volume]);

  const handleExpand = useCallback(() => {
    preserveCurrentTime();
    setPlayerMode('expanded');
  }, [preserveCurrentTime, setPlayerMode]);

  const handleMaximize = useCallback(() => {
    preserveCurrentTime();
    setPlayerMode('fullscreen');
  }, [preserveCurrentTime, setPlayerMode]);

  const handleMinimize = useCallback(() => {
    preserveCurrentTime();
    setPlayerMode('compact');
  }, [preserveCurrentTime, setPlayerMode]);

  const handleClose = useCallback(() => {
    closePlayer();
    setPlayerMode('compact');
  }, [closePlayer, setPlayerMode]);

  if (!activeTrack) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {playerMode === 'compact' && (
        <CompactPlayer
          key="compact"
          track={activeTrack}
          currentVersion={currentVersion as any}
          onExpand={handleExpand}
          onMaximize={handleMaximize}
          onClose={handleClose}
        />
      )}
      {playerMode === 'expanded' && (
        <ExpandedPlayer
          key="expanded"
          track={activeTrack}
          onClose={handleMinimize}
          onMaximize={handleMaximize}
        />
      )}
      {playerMode === 'fullscreen' && (
        <FullscreenPlayer
          key="fullscreen"
          track={activeTrack}
          currentVersion={currentVersion as any}
          onClose={handleMinimize}
        />
      )}
    </AnimatePresence>
  );
};
