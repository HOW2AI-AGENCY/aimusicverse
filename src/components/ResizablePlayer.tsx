import React, { useCallback } from 'react';
import { CompactPlayer } from './CompactPlayer';
import { FullscreenPlayer } from './FullscreenPlayer';
import { ExpandedPlayer } from './player/ExpandedPlayer';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useMasterVersion } from '@/hooks/useTrackVersions';
import { getGlobalAudioRef } from '@/hooks/audio/useAudioTime';
import { AnimatePresence } from '@/lib/motion';

export const ResizablePlayer = () => {
  const { activeTrack, closePlayer, playerMode, setPlayerMode, preserveTime } = usePlayerStore();
  
  // Fetch the primary version for correct lyrics synchronization
  const { data: currentVersion } = useMasterVersion(activeTrack?.id);

  // Preserve current time before mode switch to avoid audio restart
  const preserveCurrentTime = useCallback(() => {
    const audio = getGlobalAudioRef();
    if (audio && !isNaN(audio.currentTime)) {
      preserveTime(audio.currentTime);
    }
  }, [preserveTime]);

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
