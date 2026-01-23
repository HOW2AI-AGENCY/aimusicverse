/**
 * useHomePageHandlers - Consolidated handlers for home page
 * 
 * Extracts all callback handlers to reduce Index.tsx complexity
 * 
 * @module hooks/useHomePageHandlers
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "@/contexts/TelegramContext";
import { useAuth } from "@/hooks/useAuth";
import type { QuickStartPreset } from "@/components/home/QuickStartCards";
import type { TrackPreset } from "@/components/home/TrackPresetsRow";

interface UseHomePageHandlersOptions {
  onOpenGenerateSheet: () => void;
  onOpenAudioDialog: () => void;
}

export function useHomePageHandlers({ 
  onOpenGenerateSheet, 
  onOpenAudioDialog 
}: UseHomePageHandlersOptions) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const { user } = useAuth();

  // Navigate to profile
  const goToProfile = useCallback(() => {
    hapticFeedback("light");
    navigate(user?.id ? `/profile/${user.id}` : "/profile");
  }, [hapticFeedback, navigate, user?.id]);

  // Open generate sheet
  const handleCreate = useCallback(() => {
    hapticFeedback("medium");
    onOpenGenerateSheet();
  }, [hapticFeedback, onOpenGenerateSheet]);

  // Navigate to remix
  const handleRemix = useCallback((trackId: string) => {
    hapticFeedback("light");
    navigate(`/generate?remix=${trackId}`);
  }, [hapticFeedback, navigate]);

  // Navigate to track page
  const handleTrackClick = useCallback((trackId: string) => {
    hapticFeedback("light");
    navigate(`/track/${trackId}`);
  }, [hapticFeedback, navigate]);

  // Handler for Quick Start preset cards
  const handleQuickStartPreset = useCallback((preset: QuickStartPreset) => {
    hapticFeedback("medium");
    switch (preset) {
      case 'track':
      case 'riff':
        onOpenGenerateSheet();
        break;
      case 'cover':
        onOpenAudioDialog();
        break;
    }
  }, [hapticFeedback, onOpenGenerateSheet, onOpenAudioDialog]);

  // Handler for Track Presets - opens generation with preset applied
  const handleQuickGenrePreset = useCallback((preset: TrackPreset) => {
    hapticFeedback("medium");
    // Store preset in sessionStorage for useGenerateForm to pick up
    sessionStorage.setItem('quickGenrePreset', JSON.stringify({
      description: preset.description,
      hasVocals: preset.hasVocals,
      presetId: preset.id,
    }));
    onOpenGenerateSheet();
  }, [hapticFeedback, onOpenGenerateSheet]);

  return {
    goToProfile,
    handleCreate,
    handleRemix,
    handleTrackClick,
    handleQuickStartPreset,
    handleQuickGenrePreset,
  };
}
