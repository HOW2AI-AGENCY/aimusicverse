/**
 * useLibraryData - Unified data hook for Library page
 * 
 * Consolidates all data fetching, filtering, and state logic
 * 
 * @module hooks/useLibraryData
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useTracks, type Track } from "@/hooks/useTracks";
import { useDebounce } from "use-debounce";
import { useSyncStaleTasks, useActiveGenerations } from "@/hooks/generation";
import { useGenerationRealtime } from "@/hooks/useGenerationRealtime";
import { useTrackCounts } from "@/hooks/useTrackCounts";
import { useTracksMidiStatus } from "@/hooks/useTrackMidiStatus";
import { logger } from "@/lib/logger";

const log = logger.child({ module: 'useLibraryData' });

export type FilterOption = 'all' | 'vocals' | 'instrumental' | 'stems';
export type StatusFilter = 'all' | 'completed' | 'failed';
export type SortOption = 'recent' | 'popular' | 'liked';
export type ViewMode = 'grid' | 'list';

interface UseLibraryDataOptions {
  pageSize?: number;
}

export function useLibraryData(options: UseLibraryDataOptions = {}) {
  const { pageSize = 12 } = options;

  // Filter & search state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [typeFilter, setTypeFilter] = useState<FilterOption>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // View mode - mobile defaults to list, desktop to grid
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? "list" : "grid";
    }
    return "list";
  });

  // Realtime updates
  useGenerationRealtime();
  useSyncStaleTasks();

  // Active generation tasks
  const { data: activeGenerations = [] } = useActiveGenerations();

  // Tracks data
  const { 
    tracks, 
    totalCount,
    isLoading,
    error: tracksError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchTracks,
    deleteTrack, 
    toggleLike, 
    logPlay, 
  } = useTracks({
    searchQuery: debouncedSearchQuery,
    sortBy,
    pageSize,
    paginate: true,
    tagFilter: tagFilter || undefined,
    statusFilter: statusFilter === 'all' ? undefined : [statusFilter],
  });

  // Track previous generation count to detect completion
  const prevGenerationsCount = useRef(activeGenerations.length);
  
  // Refetch tracks when a generation completes (count decreases)
  useEffect(() => {
    if (prevGenerationsCount.current > 0 && activeGenerations.length < prevGenerationsCount.current) {
      log.info('Generation completed, refetching tracks');
      refetchTracks();
    }
    prevGenerationsCount.current = activeGenerations.length;
  }, [activeGenerations.length, refetchTracks]);

  // Batch fetch track counts (versions & stems) for all visible tracks
  const trackIds = useMemo(() => (tracks || []).map(t => t.id), [tracks]);
  const { getCountsForTrack } = useTrackCounts(trackIds);
  
  // Batch fetch MIDI/PDF status for all visible tracks
  const { midiStatusMap } = useTracksMidiStatus(trackIds);

  // Filter tracks based on type filter
  const filteredTracks = useMemo(() => {
    const allTracks = tracks || [];
    switch (typeFilter) {
      case 'vocals':
        return allTracks.filter(t => t.has_vocals === true);
      case 'instrumental':
        return allTracks.filter(t => t.is_instrumental === true || t.has_vocals === false);
      case 'stems':
        return allTracks.filter(t => t.has_stems === true);
      default:
        return allTracks;
    }
  }, [tracks, typeFilter]);

  // Count tracks for filter badges
  const filterCounts = useMemo(() => ({
    all: (tracks || []).length,
    vocals: (tracks || []).filter(t => t.has_vocals === true).length,
    instrumental: (tracks || []).filter(t => t.is_instrumental === true || t.has_vocals === false).length,
    stems: (tracks || []).filter(t => t.has_stems === true).length,
  }), [tracks]);

  // Clear tag filter
  const clearTagFilter = useCallback(() => {
    setTagFilter(null);
  }, []);

  return {
    // State
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    tagFilter,
    setTagFilter,
    viewMode,
    setViewMode,
    debouncedSearchQuery,
    
    // Data
    tracks,
    filteredTracks,
    totalCount,
    filterCounts,
    activeGenerations,
    hasActiveGenerations: activeGenerations.length > 0,
    
    // Loading states
    isLoading,
    tracksError,
    hasNextPage: hasNextPage || false,
    isFetchingNextPage,
    
    // Actions
    fetchNextPage,
    refetchTracks,
    deleteTrack,
    toggleLike,
    logPlay,
    clearTagFilter,
    
    // Utilities
    getCountsForTrack,
    midiStatusMap,
  };
}
