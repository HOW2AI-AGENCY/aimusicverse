import React, { useState } from 'react';
import { CompactPlayer } from './CompactPlayer';
import { FullscreenPlayer } from './FullscreenPlayer';
import { usePlayerStore } from '@/hooks/usePlayerState';

export const ResizablePlayer = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { activeTrack, closePlayer } = usePlayerStore();

  const handleMaximize = () => {
    setIsMaximized(true);
  };

  const handleMinimize = () => {
    setIsMaximized(false);
  };

  if (!activeTrack) {
    return null;
  }

  return (
    <>
      {!isMaximized && (
        <CompactPlayer
          track={activeTrack}
          onMaximize={handleMaximize}
          onClose={closePlayer}
        />
      )}
      {isMaximized && (
        <FullscreenPlayer
          track={activeTrack}
          onClose={handleMinimize}
        />
      )}
    </>
  );
};
