/**
 * useTrackCardLogic - Shared logic for all track card variants
 * 
 * Extracts common patterns from:
 * - MinimalTrackCard
 * - TrackCardEnhanced
 * - TrackCard
 */

import { useState, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useTelegram } from '@/contexts/TelegramContext';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import type { Track } from '@/types/track';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';

export interface TrackCardLogicOptions {
  track: Track | PublicTrackWithCreator;
  onPlay?: () => void;
  onDelete?: () => void;
  onOpenSheet?: () => void;
}

export function useTrackCardLogic({
  track,
  onPlay,
  onDelete,
  onOpenSheet,
}: TrackCardLogicOptions) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const { hapticFeedback } = useTelegram();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const isCurrentTrack = activeTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
  const isOwner = user?.id === track.user_id;

  // Convert to Track type for player
  const trackForPlayer: Track = {
    ...track,
    is_liked: (track as any).user_liked ?? (track as any).is_liked ?? false,
    likes_count: track.likes_count ?? 0,
  };

  // Handle card click - opens sheet on mobile, or custom handler
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Ignore clicks on interactive elements
    if (target.closest('button') || target.closest('[data-play-button]') || target.closest('[data-no-click]')) {
      return;
    }
    
    if (isMobile) {
      triggerHapticFeedback('light');
    }
    
    if (onOpenSheet) {
      onOpenSheet();
    } else {
      setSheetOpen(true);
    }
  }, [isMobile, onOpenSheet]);

  // Handle play/pause
  const handlePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHapticFeedback('medium');
    
    if (onPlay) {
      onPlay();
      return;
    }

    if (isCurrentTrack) {
      if (isPlaying) {
        pauseTrack();
      } else {
        playTrack(trackForPlayer);
      }
    } else {
      playTrack(trackForPlayer);
    }
  }, [isCurrentTrack, isPlaying, onPlay, pauseTrack, playTrack, trackForPlayer]);

  // Handle hover states
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(e as any);
    }
  }, [handleCardClick]);

  // Handle sheet open/close
  const openSheet = useCallback(() => {
    if (isMobile) {
      triggerHapticFeedback('light');
    }
    setSheetOpen(true);
  }, [isMobile]);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  return {
    // State
    sheetOpen,
    setSheetOpen,
    isHovered,
    isCurrentTrack,
    isCurrentlyPlaying,
    isOwner,
    isMobile,
    user,
    trackForPlayer,
    
    // Handlers
    handleCardClick,
    handlePlay,
    handleMouseEnter,
    handleMouseLeave,
    handleKeyDown,
    openSheet,
    closeSheet,
  };
}
