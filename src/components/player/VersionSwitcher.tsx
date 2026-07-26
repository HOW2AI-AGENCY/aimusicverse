/**
 * VersionSwitcher Component
 *
 * Quick A/B version switching directly in the player.
 * Shows version badges (A, B, etc.) for fast switching without opening versions tab.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTrackVersionsForSwitcher } from "@/services/generation/track-versions.service";
import { Button } from "@/components/ui/button";
import type { Track } from "@/types/track";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useVersionSwitcher } from "@/hooks/useVersionSwitcher";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "@/lib/motion";
import { hapticImpact } from "@/lib/haptic";
import { toast } from "sonner";
import { Loader2 } from "@/lib/icons";

interface VersionSwitcherProps {
  track: Track;
  size?: "compact" | "medium" | "large";
  className?: string;
}

export function VersionSwitcher({ track, size = "medium", className }: VersionSwitcherProps) {
  const { activeTrack, isPlaying, playTrack } = usePlayerStore();
  const { setPrimaryVersionAsync, isSettingPrimary } = useVersionSwitcher();
  const queryClient = useQueryClient();
  // Optimistic override — the versions list (is_primary) is cached for 5min
  // and isn't in useVersionSwitcher's invalidation list, so without this the
  // active badge would keep pointing at the old version after a switch.
  const [pendingActiveId, setPendingActiveId] = useState<string | null>(null);

  // Extract original track ID if current track is a version
  const originalTrackId = track.id?.includes("_v") ? track.id.split("_v")[0] : track.id;

  const sizeClasses = {
    compact: "h-9 w-9 text-xs", // 36px minimum for inline compact
    medium: "h-11 w-11 text-sm", // 44px - meets touch target
    large: "h-12 w-12 text-base", // 48px - optimal for mobile
  };

  const gapClasses = {
    compact: "gap-1",
    medium: "gap-1.5",
    large: "gap-2",
  };

  // Fetch versions for this track with optimized loading
  const { data: versions, isLoading } = useQuery({
    queryKey: ["track-versions-switcher", originalTrackId],
    queryFn: async () => {
      return getTrackVersionsForSwitcher(originalTrackId);
    },
    enabled: !!originalTrackId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  // Show loading skeleton while fetching
  if (isLoading) {
    return (
      <div className={cn("flex items-center", gapClasses[size], className)}>
        {[0, 1].map((i) => (
          <div key={i} className={cn(sizeClasses[size], "rounded-full bg-muted animate-pulse")} />
        ))}
      </div>
    );
  }

  // Don't show if only one or no versions
  if (!versions || versions.length <= 1) {
    return null;
  }

  const activeVersionId = pendingActiveId ?? versions.find((v) => v.is_primary)?.id ?? versions[0]?.id;

  const handleVersionClick = async (version: (typeof versions)[0]) => {
    if (isSettingPrimary || version.id === activeVersionId) return;

    hapticImpact("light");
    setPendingActiveId(version.id);

    try {
      // Persist as the track's primary version (real trackId, not the version
      // id) — previously this called playTrack() with `id: version.id`, which
      // masqueraded the version as the track everywhere downstream (likes,
      // details pane "is this playing" check, lyrics sync) without ever
      // updating tracks.active_version_id, causing the switch to desync.
      await setPrimaryVersionAsync({ trackId: originalTrackId, versionId: version.id });

      // Keep playback in sync with the new primary, preserving the real track id.
      if (activeTrack?.id === originalTrackId) {
        usePlayerStore.getState().switchVersionAudio({
          audio_url: version.audio_url,
          streaming_url: version.audio_url,
          local_audio_url: null,
          cover_url: version.cover_url || activeTrack.cover_url,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["track-versions-switcher", originalTrackId] });
    } catch {
      setPendingActiveId(null);
      toast.error("Не удалось переключить версию");
    }
  };

  const isVersionActive = (versionId: string) => versionId === activeVersionId;

  return (
    <div className={cn("flex items-center", gapClasses[size], className)}>
      <AnimatePresence mode="popLayout">
        {versions.map((version, index) => {
          const label = version.version_label || String.fromCharCode(65 + index);
          const isActive = isVersionActive(version.id);
          const isCurrentlyPlaying = isActive && isPlaying && activeTrack?.id === originalTrackId;
          const isThisSwitching = isSettingPrimary && pendingActiveId === version.id;

          return (
            <motion.div
              key={version.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant={isActive ? "default" : "outline"}
                size="icon"
                onClick={() => handleVersionClick(version)}
                disabled={isSettingPrimary}
                className={cn(
                  sizeClasses[size],
                  "rounded-full font-semibold transition-all",
                  isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  isCurrentlyPlaying && "animate-pulse",
                  !isActive && "opacity-60 hover:opacity-100",
                  isSettingPrimary && "cursor-not-allowed",
                )}
                title={`Версия ${label}${version.is_primary ? " (мастер)" : ""}`}
              >
                {isThisSwitching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : label}
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
