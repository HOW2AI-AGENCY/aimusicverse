/**
 * PlayerActions - Overlay actions for the fullscreen player.
 * Manages queue sheet, karaoke mode, and gesture hints.
 */

import { AnimatePresence } from "@/lib/motion";
import { QueueSheet } from "./QueueSheet";
import { KaraokeView } from "./KaraokeView";
import { PlayerGestureHints } from "./PlayerGestureHints";

interface AlignedWord {
  word: string;
  startS: number;
  endS: number;
}

interface PlayerActionsProps {
  queueOpen: boolean;
  onQueueOpenChange: (open: boolean) => void;
  karaokeMode: boolean;
  onKaraokeModeClose: () => void;
  lyricsLines: AlignedWord[][] | null;
  syncedTime: number;
  isPlaying: boolean;
  activeLineIndex: number;
  onSeek: (time: number) => void;
}

export function PlayerActions({
  queueOpen,
  onQueueOpenChange,
  karaokeMode,
  onKaraokeModeClose,
  lyricsLines,
  syncedTime,
  isPlaying,
  activeLineIndex,
  onSeek,
}: PlayerActionsProps) {
  return (
    <>
      {/* First-run gesture cheatsheet */}
      <PlayerGestureHints />

      {/* Queue Sheet */}
      <QueueSheet open={queueOpen} onOpenChange={onQueueOpenChange} />

      {/* Karaoke Mode */}
      <AnimatePresence>
        {karaokeMode && lyricsLines && (
          <KaraokeView
            lyricsLines={lyricsLines}
            currentTime={syncedTime}
            isPlaying={isPlaying}
            activeLineIndex={activeLineIndex}
            onClose={onKaraokeModeClose}
            onSeek={onSeek}
          />
        )}
      </AnimatePresence>
    </>
  );
}
