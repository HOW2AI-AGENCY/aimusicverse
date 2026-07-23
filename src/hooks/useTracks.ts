/**
 * useTracks - Main hook for track operations
 * Uses service layer architecture
 */

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as tracksService from "@/services/tracks.service";
import * as tracksApi from "@/api/tracks.api";
import { useGuestMode } from "@/contexts/GuestModeContext";
import { mockTracks as screenshotMockTracks } from "@/lib/screenshotMockData";

// Re-export Track type for convenience
export type { Track, TrackWithCreator, TrackSummary } from "@/types/track";
export type { EnrichedTrack } from "@/services/tracks.service";

const PAGE_SIZE = 12; // Optimized for faster initial load

export interface UseTracksParams {
  projectId?: string;
  searchQuery?: string;
  sortBy?: "recent" | "popular" | "liked";
  paginate?: boolean;
  pageSize?: number;
  statusFilter?: string[];
  tagFilter?: string; // Filter by specific tag
}

/**
 * Main tracks hook with optional pagination
 */
export function useTracks(params: UseTracksParams = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isScreenshotMode } = useGuestMode();
  const { paginate = false, projectId, searchQuery, sortBy, pageSize = PAGE_SIZE, statusFilter, tagFilter } = params;

  const queryKey = ["tracks", user?.id, projectId, searchQuery, sortBy, paginate, pageSize, statusFilter, tagFilter];

  const infiniteQuery = useInfiniteQuery({
    queryKey: [...queryKey, "infinite"],
    queryFn: async ({ pageParam }) => {
      if (!user?.id) return { tracks: [], totalCount: 0, hasMore: false };
      return tracksService.fetchTracksWithLikes(
        user.id,
        { projectId, searchQuery, sortBy, statusFilter, tagFilter },
        { page: pageParam, pageSize },
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || !allPages) {
        return undefined;
      }
      if (typeof lastPage.hasMore === "undefined") {
        return undefined;
      }
      return lastPage.hasMore ? allPages.length : undefined;
    },
    enabled: !!user?.id && paginate === true && !isScreenshotMode,
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
  });

  const simpleQuery = useQuery({
    queryKey: [...queryKey, "simple"],
    queryFn: async () => {
      if (!user?.id) return [];
      const result = await tracksService.fetchTracksWithLikes(user.id, {
        projectId,
        searchQuery,
        sortBy,
        statusFilter,
        tagFilter,
      });
      return result.tracks;
    },
    enabled: !!user?.id && paginate === false && !isScreenshotMode,
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!user?.id || isScreenshotMode) return;

    const channel = supabase
      .channel(`tracks_${user.id}_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tracks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Only invalidate on meaningful status transitions to avoid
          // re-fetching all tracks on every incremental update.
          const newStatus = (payload.new as Record<string, unknown>)?.status as string | undefined;
          const oldStatus = (payload.old as Record<string, unknown>)?.status as string | undefined;

          // Always invalidate for INSERT (new track) or DELETE
          // For UPDATE: only if transitioned to completed/failed
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "DELETE" ||
            newStatus === "completed" ||
            newStatus === "failed" ||
            (oldStatus === "pending" && newStatus === "processing") // first visible transition
          ) {
            queryClient.invalidateQueries({ queryKey: ["tracks", user.id] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: tracksService.deleteTrackWithCleanup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks", user?.id] });
      toast.success("Трек удален");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка удаления");
    },
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error("Not authenticated");
      return tracksService.toggleLike(trackId, user.id, isLiked);
    },
    onSuccess: (_, { isLiked }) => {
      queryClient.invalidateQueries({ queryKey: ["tracks", user?.id] });
      toast.success(isLiked ? "Удалено из избранного" : "Добавлено в избранное");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка");
    },
  });

  const logPlayMutation = useMutation({
    mutationFn: tracksService.logTrackPlay,
  });

  const downloadTrack = useCallback((params: { trackId: string; audioUrl: string; coverUrl?: string }) => {
    if (params.audioUrl) {
      window.open(params.audioUrl, "_blank");
    }
  }, []);

  const deleteTrack = useCallback((trackId: string) => deleteMutation.mutate(trackId), [deleteMutation]);
  const toggleLike = useCallback(
    (params: { trackId: string; isLiked: boolean }) => likeMutation.mutate(params),
    [likeMutation],
  );
  const logPlay = useCallback((trackId: string) => logPlayMutation.mutate(trackId), [logPlayMutation]);

  if (isScreenshotMode) {
    return {
      tracks: screenshotMockTracks as unknown as import("@/services/tracks.service").EnrichedTrack[],
      totalCount: screenshotMockTracks.length,
      isLoading: false,
      error: null,
      fetchNextPage: () => Promise.resolve(),
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: () => Promise.resolve(),
      deleteTrack: () => {},
      toggleLike: () => {},
      logPlay: () => {},
      downloadTrack: () => {},
      isDeleting: false,
      isTogglingLike: false,
    };
  }

  const tracks = paginate
    ? infiniteQuery.data?.pages.flatMap((page) => page.tracks) || []
    : (simpleQuery.data as tracksService.EnrichedTrack[]) || [];

  const totalCount = paginate ? infiniteQuery.data?.pages[0]?.totalCount || 0 : tracks.length;

  return {
    tracks,
    totalCount,
    isLoading: paginate ? infiniteQuery.isLoading : simpleQuery.isLoading,
    error: paginate ? infiniteQuery.error : simpleQuery.error,
    fetchNextPage: paginate ? infiniteQuery.fetchNextPage : () => Promise.resolve(),
    hasNextPage: paginate ? infiniteQuery.hasNextPage : false,
    isFetchingNextPage: paginate ? infiniteQuery.isFetchingNextPage : false,
    refetch: paginate ? infiniteQuery.refetch : simpleQuery.refetch,
    deleteTrack,
    toggleLike,
    logPlay,
    downloadTrack,
    isDeleting: deleteMutation.isPending,
    isTogglingLike: likeMutation.isPending,
  };
}

/**
 * Hook for fetching a single track
 */
export function useTrack(trackId: string | undefined) {
  return useQuery({
    queryKey: ["track", trackId],
    queryFn: () => tracksApi.fetchTrackById(trackId!),
    enabled: !!trackId,
    staleTime: 30000,
  });
}

/**
 * Hook for public tracks (homepage/discovery)
 */
export function usePublicTracks(pageSize = 20) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ["public-tracks", user?.id],
    queryFn: async ({ pageParam }) => {
      return tracksService.fetchPublicTracksWithCreators(user?.id ?? null, { page: pageParam, pageSize });
    },
    getNextPageParam: (lastPage, allPages) => {
      // Safely handle undefined or malformed data
      if (!lastPage || !allPages) {
        return undefined;
      }
      if (typeof lastPage.hasMore === "undefined") {
        return undefined;
      }
      return lastPage.hasMore ? allPages.length : undefined;
    },
    staleTime: 30000,
    initialPageParam: 0,
  });
}
