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
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import type { Track } from "@/types/track";
import type { QuickStartPreset } from "@/components/home/QuickStartCards";
import type { TrackPreset } from "@/components/home/TrackPresetsRow";

interface UseHomePageHandlersOptions {
  onOpenGenerateSheet: () => void;
  onOpenAudioDialog: () => void;
}

export function useHomePageHandlers({ onOpenGenerateSheet, onOpenAudioDialog }: UseHomePageHandlersOptions) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const { user } = useAuth();
  const playTrack = usePlayerStore((s) => s.playTrack);

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
  const handleRemix = useCallback(
    (trackId: string) => {
      hapticFeedback("light");
      navigate(`/generate?remix=${trackId}`);
    },
    [hapticFeedback, navigate],
  );

  // Play a track in the global compact player. Accepts any object with at
  // least an `id` (home sections use several narrower shapes like
  // PublicTrackWithCreator, TrendingTrack, etc.) or a bare id string, which
  // falls back to /track/:id for a full page load.
  const handleTrackClick = useCallback(
    (trackOrId: { id: string } | string) => {
      hapticFeedback("light");
      if (typeof trackOrId === "string") {
        navigate(`/track/${trackOrId}`);
        return;
      }
      // playTrack tolerates partial shapes at runtime — it reads id/audio_url/title/cover_url.
      playTrack(trackOrId as unknown as Track);
    },
    [hapticFeedback, navigate, playTrack],
  );

  // Handler for Quick Start preset cards
  const handleQuickStartPreset = useCallback(
    (preset: QuickStartPreset) => {
      hapticFeedback("medium");
      switch (preset) {
        case "track":
        case "riff":
          onOpenGenerateSheet();
          break;
        case "cover":
          onOpenAudioDialog();
          break;
      }
    },
    [hapticFeedback, onOpenGenerateSheet, onOpenAudioDialog],
  );

  // Handler for Track Presets - opens generation with preset applied
  const handleQuickGenrePreset = useCallback(
    (preset: TrackPreset) => {
      hapticFeedback("medium");
      // Store preset in sessionStorage for useGenerateForm to pick up
      sessionStorage.setItem(
        "quickGenrePreset",
        JSON.stringify({
          description: preset.description,
          hasVocals: preset.hasVocals,
          presetId: preset.id,
        }),
      );
      onOpenGenerateSheet();
    },
    [hapticFeedback, onOpenGenerateSheet],
  );

  return {
    goToProfile,
    handleCreate,
    handleRemix,
    handleTrackClick,
    handleQuickStartPreset,
    handleQuickGenrePreset,
  };
}
