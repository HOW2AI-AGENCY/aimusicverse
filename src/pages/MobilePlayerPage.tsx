/**
 * MobilePlayerPage - Standalone fullscreen player page for deep links
 *
 * Accessed via:
 * - /player/:trackId
 * - Deep links: play_{trackId}, player_{trackId}, listen_{trackId}
 *
 * Automatically loads track and starts playback in fullscreen mode
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { FullscreenPlayer } from "@/components/player/FullscreenPlayer";
import { PlayerTransitionProvider } from "@/components/player/PlayerTransitionProvider";
import { Loader2, ChevronLeft, Music2, AlertTriangle, RefreshCw } from "@/lib/icons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import type { Track } from "@/types/track";
import { logger } from "@/lib/logger";

// UUID v1-v5 pattern — Supabase generates v4 for track ids.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TrackLoadErrorReason = "invalid-id" | "not-found" | "forbidden" | "network" | "unknown";

class TrackLoadError extends Error {
  reason: TrackLoadErrorReason;
  code?: string;
  details?: string;
  constructor(reason: TrackLoadErrorReason, message: string, code?: string, details?: string) {
    super(message);
    this.reason = reason;
    this.code = code;
    this.details = details;
  }
}

export default function MobilePlayerPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();
  const { playTrack, setPlayerMode } = usePlayerStore();
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);

  // Fetch track data
  const {
    data: track,
    isLoading,
    error,
  } = useQuery<Track, TrackLoadError>({
    queryKey: ["player-track", trackId],
    retry: (failureCount, err) => {
      // Don't retry deterministic failures — they won't fix themselves.
      if (
        err instanceof TrackLoadError &&
        (err.reason === "not-found" || err.reason === "invalid-id" || err.reason === "forbidden")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    queryFn: async () => {
      logger.info("MobilePlayerPage: fetch start", {
        trackId,
        trackIdType: typeof trackId,
        trackIdLength: trackId?.length,
      });

      if (!trackId) {
        throw new TrackLoadError("invalid-id", "Отсутствует идентификатор трека");
      }
      if (!UUID_RE.test(trackId)) {
        logger.warn("MobilePlayerPage: trackId is not a UUID", { trackId });
        throw new TrackLoadError("invalid-id", `Некорректный формат идентификатора: ${trackId}`);
      }

      // Log auth context — RLS depends on it.
      const { data: sessionData } = await supabase.auth.getSession();
      logger.info("MobilePlayerPage: auth context", {
        hasSession: !!sessionData.session,
        userId: sessionData.session?.user?.id ?? null,
      });

      // NOTE: tracks.user_id has no FK → profiles, so we can't embed profiles
      // via PostgREST. Fetch the track first, then enrich with the creator
      // profile via a separate query.
      const { data, error: dbError } = await supabase.from("tracks").select("*").eq("id", trackId).maybeSingle();

      if (dbError) {
        // PostgREST error codes:
        //   42501 — permission denied (RLS or GRANT)
        //   PGRST301 — JWT expired / auth issue
        const code = (dbError as { code?: string }).code;
        const reason: TrackLoadErrorReason = code === "42501" || code === "PGRST301" ? "forbidden" : "network";
        logger.error("MobilePlayerPage: tracks query failed", {
          trackId,
          code,
          message: dbError.message,
          details: (dbError as { details?: string }).details,
          hint: (dbError as { hint?: string }).hint,
        });
        throw new TrackLoadError(reason, dbError.message, code, (dbError as { details?: string }).details);
      }

      if (!data) {
        logger.warn("MobilePlayerPage: track row not returned", {
          trackId,
          hasSession: !!sessionData.session,
          note: "either the row doesn't exist or RLS is filtering it silently",
        });
        // Try to differentiate "not exists" from "RLS-filtered".
        // A HEAD count with the same predicate returns 0 for both cases (RLS
        // filters count too), so we probe with a broader query that only
        // filters by id under the RLS view. If the id is well-formed but the
        // row is invisible, we surface it as "forbidden" when the caller is
        // authenticated (they'd normally see their own tracks) and as
        // "not-found" when anon.
        throw new TrackLoadError(
          sessionData.session ? "forbidden" : "not-found",
          sessionData.session ? "Трек существует, но недоступен вам (приватный)" : "Трек не найден",
        );
      }

      let profile: { username: string | null; display_name: string | null; photo_url: string | null } | null = null;
      if (data.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, display_name, photo_url")
          .eq("user_id", data.user_id)
          .maybeSingle();
        if (profileError) {
          logger.warn("MobilePlayerPage: profile fetch failed (non-fatal)", {
            userId: data.user_id,
            code: (profileError as { code?: string }).code,
            message: profileError.message,
          });
        }
        profile = profileData ?? null;
      }

      logger.info("MobilePlayerPage: fetch success", {
        trackId: data.id,
        title: data.title,
        hasAudio: !!data.audio_url,
        isPublic: data.is_public,
      });

      // Transform to Track type with is_liked default
      return {
        ...data,
        profiles: profile,
        is_liked: false, // Will be updated by useLikes hook if needed
      } as unknown as Track;
    },
    enabled: !!trackId,
    staleTime: 1000 * 60 * 5,
  });

  // Auto-start playback when track loads
  useEffect(() => {
    if (track && !hasStartedPlayback) {
      logger.info("MobilePlayerPage: Starting playback", { trackId: track.id, title: track.title });

      // Set player mode to fullscreen and start playing
      setPlayerMode("fullscreen");

      // Small delay to ensure audio element is ready
      const timer = setTimeout(() => {
        playTrack(track);
        setHasStartedPlayback(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [track, hasStartedPlayback, playTrack, setPlayerMode]);

  // Cleanup: whenever this page unmounts (browser back, route change, swipe),
  // demote the global player mode back to compact so the app-wide ResizablePlayer
  // in MainLayout doesn't keep the FullscreenPlayer overlay mounted on other
  // routes — that manifested as a black screen with audio still playing.
  useEffect(() => {
    return () => {
      const currentMode = usePlayerStore.getState().playerMode;
      if (currentMode === "fullscreen") {
        usePlayerStore.getState().setPlayerMode("compact");
      }
    };
  }, []);

  // Handle back navigation
  const handleBack = () => {
    setPlayerMode("compact");
    navigate("/library", { replace: true });
  };

  // Handle closing fullscreen player
  const handleCloseFullscreen = () => {
    setPlayerMode("compact");
    navigate("/library", { replace: true });
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50"
        style={{
          paddingTop:
            "max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))",
          paddingBottom:
            "max(var(--tg-content-safe-area-inset-bottom, 0px) + var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Music2 className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <Loader2 className="absolute -top-1 -right-1 w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Загрузка трека...</p>
        </div>
      </div>
    );
  }

  // Error state — differentiate reasons so the user gets a truthful message.
  if (error || !track) {
    const reason: TrackLoadErrorReason = error?.reason ?? "not-found";
    const title =
      reason === "forbidden"
        ? "Нет доступа к треку"
        : reason === "invalid-id"
          ? "Неверная ссылка"
          : reason === "network"
            ? "Не удалось загрузить трек"
            : "Трек не найден";
    const description =
      reason === "forbidden"
        ? "Трек существует, но помечен как приватный или недоступен вашей учётной записи."
        : reason === "invalid-id"
          ? "Идентификатор трека в ссылке некорректен."
          : reason === "network"
            ? `Проблема с соединением или сервером${error?.code ? ` (код ${error.code})` : ""}.`
            : "Возможно, трек был удалён или ссылка недействительна.";

    return (
      <div
        className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-6"
        style={{
          paddingTop:
            "max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 1.5rem, env(safe-area-inset-top, 0px) + 1.5rem)",
          paddingBottom:
            "max(var(--tg-content-safe-area-inset-bottom, 0px) + var(--tg-safe-area-inset-bottom, 0px) + 1.5rem, env(safe-area-inset-bottom, 0px) + 1.5rem)",
        }}
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <Music2 className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
          {trackId && <p className="text-muted-foreground/60 text-xs font-mono break-all">id: {trackId}</p>}
          <Button onClick={handleBack} variant="outline" className="mt-4">
            <ChevronLeft className="w-4 h-4 mr-2" />В библиотеку
          </Button>
        </div>
      </div>
    );
  }

  // Render fullscreen player with an isolated ErrorBoundary so a crash
  // inside the player subtree (e.g. missing provider, waveform failure)
  // shows a recovery UI instead of the app-wide "Что-то пошло не так" page.
  return (
    <PlayerTransitionProvider>
      <ErrorBoundary
        fallback={(err, reset) => (
          <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-6" role="alert">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold">Плеер не смог загрузиться</h2>
              <p className="text-muted-foreground text-sm break-words">{err.message}</p>
              <div className="flex flex-col gap-2 w-full mt-2">
                <Button onClick={reset} variant="default">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Попробовать снова
                </Button>
                <Button onClick={handleBack} variant="outline">
                  <ChevronLeft className="w-4 h-4 mr-2" />В библиотеку
                </Button>
              </div>
            </div>
          </div>
        )}
      >
        <div className="fixed inset-0 z-50">
          <FullscreenPlayer track={track} onClose={handleCloseFullscreen} />
        </div>
      </ErrorBoundary>
    </PlayerTransitionProvider>
  );
}
