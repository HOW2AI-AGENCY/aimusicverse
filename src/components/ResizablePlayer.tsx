import React from 'react';
import { CompactPlayer } from './CompactPlayer';
import { FullscreenPlayer } from './FullscreenPlayer';
import { ExpandedPlayer } from './player/ExpandedPlayer';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useMasterVersion } from '@/hooks/useTrackVersions';
import { AnimatePresence } from '@/lib/motion';

export const ResizablePlayer = () => {
  const { activeTrack, closePlayer, playerMode, setPlayerMode } = usePlayerStore();
  
  // Fetch the primary version for correct lyrics synchronization
  const { data: currentVersion } = useMasterVersion(activeTrack?.id);

  const handleExpand = () => {
    setPlayerMode('expanded');
  };

  const handleMaximize = () => {
    setPlayerMode('fullscreen');
  };

  const handleMinimize = () => {
    setPlayerMode('compact');
  };

  const handleClose = () => {
    closePlayer();
    setPlayerMode('compact');
  };

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
