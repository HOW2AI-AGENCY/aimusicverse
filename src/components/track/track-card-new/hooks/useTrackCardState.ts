/**
 * useTrackCardState - Shared state and logic for track cards
 *
 * Extracts common logic from all track card variants:
 * - Playing state detection
 * - Hover/interaction state
 * - Sheet/menu state
 * - Play handler
 * - Card click handler
 * - Ownership detection
 */

import { useState, useCallback, useMemo } from "react";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { hapticImpact } from "@/lib/haptic";
import type { TrackData } from "../types";
import type { Track } from "@/types/track";

interface UseTrackCardStateOptions {
  track: TrackData;
  onPlay?: () => void;
  isPlaying?: boolean;
}

export function useTrackCardState({ track, onPlay, isPlaying: isPlayingProp }: UseTrackCardStateOptions) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Check if current user owns this track
  const isOwnTrack = useMemo(() => {
    if (!user?.id) return false;
    return user.id === track.user_id;
  }, [user?.id, track.user_id]);

  // Player state
  const { activeTrack, isPlaying: storeIsPlaying, playTrack, pauseTrack } = usePlayerStore();

  // Determine if this track is currently playing
  const isCurrentTrack = activeTrack?.id === track.id;
  const isCurrentlyPlaying = isPlayingProp ?? (isCurrentTrack && storeIsPlaying);

  // Convert to Track type for player (handles PublicTrackWithCreator)
  const trackForPlayer = useMemo((): Track => {
    const base = track as Track & {
      user_liked?: boolean;
      like_count?: number;
    };
    return {
      ...track,
      is_liked: base.is_liked ?? base.user_liked ?? false,
      likes_count: base.likes_count ?? base.like_count ?? 0,
    };
  }, [track]);

  // Play/Pause handler
  const handlePlay = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      hapticImpact("medium");

      // Pause always wins, even when the list supplies its own play handler —
      // otherwise the card's pause button is a no-op while the track plays.
      if (isCurrentTrack && storeIsPlaying) {
        pauseTrack();
        return;
      }

      if (onPlay) {
        onPlay();
        return;
      }

      if (isCurrentTrack && storeIsPlaying) {
        pauseTrack();
      } else {
        playTrack(trackForPlayer);
      }
    },
    [onPlay, isCurrentTrack, storeIsPlaying, pauseTrack, playTrack, trackForPlayer],
  );

  // Card click handler
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't trigger if clicking on buttons or interactive elements
      if (
        target.closest("button") ||
        target.closest("[data-play-button]") ||
        target.closest('[role="menuitem"]') ||
        target.closest("[data-radix-collection-item]") ||
        target.closest("[data-radix-dropdown-menu-content]") ||
        target.closest("[data-menu-trigger]")
      ) {
        return;
      }

      if (isMobile) {
        hapticImpact("light");
      }
      setSheetOpen(true);
    },
    [isMobile],
  );

  // Open sheet directly
  const openSheet = useCallback(() => {
    hapticImpact("light");
    setSheetOpen(true);
  }, []);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCardClick(e as unknown as React.MouseEvent);
      }
    },
    [handleCardClick],
  );

  // Hover handlers
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return {
    // State
    sheetOpen,
    setSheetOpen,
    isHovered,
    isMobile,
    isCurrentTrack,
    isCurrentlyPlaying,
    trackForPlayer,
    isOwnTrack,

    // Handlers
    handlePlay,
    handleCardClick,
    handleKeyDown,
    handleMouseEnter,
    handleMouseLeave,
    openSheet,
  };
}
