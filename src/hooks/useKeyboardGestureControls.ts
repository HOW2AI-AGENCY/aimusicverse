import { useEffect } from "react";

interface KeyboardGestureOptions {
  enabled?: boolean;
  seekAmount?: number;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onTogglePlay: () => void;
  onClose: () => void;
}

export function useKeyboardGestureControls({
  enabled = true,
  seekAmount = 10,
  onSeekForward,
  onSeekBackward,
  onNextTrack,
  onPrevTrack,
  onTogglePlay,
  onClose,
}: KeyboardGestureOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) onNextTrack();
          else onSeekForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) onPrevTrack();
          else onSeekBackward();
          break;
        case " ":
          e.preventDefault();
          onTogglePlay();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, seekAmount, onSeekForward, onSeekBackward, onNextTrack, onPrevTrack, onTogglePlay, onClose]);
}
