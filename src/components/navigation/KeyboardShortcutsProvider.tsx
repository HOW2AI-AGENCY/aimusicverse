/**
 * KeyboardShortcutsProvider
 * Global keyboard shortcuts for the application
 *
 * Shortcuts:
 * - Space: Play/Pause (when not in input)
 * - Ctrl/Cmd+G: Open generation sheet
 * - Ctrl/Cmd+L: Go to Library
 * - Escape: Close panels/dialogs
 * - M: Mute/Unmute
 * - Left/Right: Seek -5/+5 seconds
 */

import { useEffect, useCallback, useState, createContext, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";

interface ShortcutsContextType {
  generateSheetOpen: boolean;
  setGenerateSheetOpen: (open: boolean) => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null);

export function useShortcuts() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error("useShortcuts must be used within KeyboardShortcutsProvider");
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  onOpenGenerateSheet?: () => void;
}

export function KeyboardShortcutsProvider({ children, onOpenGenerateSheet }: KeyboardShortcutsProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);

  const { isPlaying, playTrack, pauseTrack, volume, setVolume, activeTrack } = usePlayerStore();

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }, [isPlaying, playTrack, pauseTrack]);

  // Simple mute toggle using volume
  const [previousVolume, setPreviousVolume] = useState(1);
  const isMuted = volume === 0;

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(previousVolume || 1);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
    }
  }, [isMuted, volume, previousVolume, setVolume]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Never intercept keys mid-IME-composition (CJK / accented input). The
      // keydown that updates or commits a candidate reports isComposing=true
      // and must reach the textarea untouched — otherwise a chord like
      // Ctrl+Shift+M would fire the mute shortcut while the user is composing.
      if (e.isComposing) return;

      // Skip if typing in input/textarea/contenteditable
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // Allow shortcuts with modifiers in inputs
      const hasModifier = e.ctrlKey || e.altKey || e.metaKey;

      // Skip non-modifier shortcuts when in inputs
      if (isInput && !hasModifier) {
        return;
      }

      const key = e.key.toLowerCase();
      const code = e.code;

      // Ctrl/Cmd + G: Open generation sheet
      if ((e.ctrlKey || e.metaKey) && key === "g") {
        e.preventDefault();
        if (onOpenGenerateSheet) {
          onOpenGenerateSheet();
        } else {
          setGenerateSheetOpen(true);
        }
        return;
      }

      // Ctrl/Cmd + L: Go to Library
      if ((e.ctrlKey || e.metaKey) && key === "l") {
        e.preventDefault();
        navigate("/library");
        return;
      }

      // Skip rest of shortcuts if in input (no modifier)
      if (isInput) return;

      // The shortcuts below are single, unmodified keys. Bail if any modifier
      // is held so chords such as Ctrl+Shift+M (dev metrics overlay toggle) or
      // Cmd+M (native minimize) aren't swallowed by the mute / play handlers.
      if (hasModifier || e.shiftKey) return;

      // Space: Play/Pause
      if (code === "Space") {
        e.preventDefault();
        togglePlayPause();
        return;
      }

      // M: Mute/Unmute
      if (key === "m") {
        e.preventDefault();
        toggleMute();
        return;
      }

      // Escape: Close generation sheet
      if (key === "escape") {
        setGenerateSheetOpen(false);
        return;
      }
    },
    [navigate, togglePlayPause, toggleMute, onOpenGenerateSheet],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <ShortcutsContext.Provider value={{ generateSheetOpen, setGenerateSheetOpen }}>
      {children}
    </ShortcutsContext.Provider>
  );
}

/**
 * Display keyboard shortcuts info
 */
export function ShortcutsHelpContent() {
  const shortcuts = [
    { keys: ["Space"], description: "Play/Pause" },
    { keys: ["Ctrl", "G"], description: "Создать трек" },
    { keys: ["Ctrl", "L"], description: "Библиотека" },
    { keys: ["M"], description: "Mute/Unmute" },
    { keys: ["Esc"], description: "Закрыть панель" },
  ];

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm mb-3">Горячие клавиши</h4>
      <div className="space-y-1.5">
        {shortcuts.map((shortcut, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{shortcut.description}</span>
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, j) => (
                <kbd key={j} className="px-1.5 py-0.5 bg-muted rounded text-[0.625rem] font-mono">
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
