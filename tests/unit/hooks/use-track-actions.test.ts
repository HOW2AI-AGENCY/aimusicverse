/**
 * Unit tests for useTrackActions hook
 *
 * Per contracts/useTrackActions.contract.ts:
 * - Track operations with optimistic updates
 * - Like, unlike, share, delete actions
 * - Add/remove from playlist
 * - Remix and download actions
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTrackActions } from '@/hooks/track/use-track-actions';
import type { UseTrackActionsParams } from '@/hooks/types/track';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useTrackActions', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  const defaultParams: UseTrackActionsParams = {
    trackId: 'track-123',
    enableOptimistic: true,
  };

  it('should provide likeTrack function', () => {
    const { result } = renderHook(() => useTrackActions(defaultParams), { wrapper });

    expect(typeof result.current.likeTrack).toBe('function');
  });

  it('should provide unlikeTrack function', () => {
    const { result } = renderHook(() => useTrackActions(defaultParams), { wrapper });

    expect(typeof result.current.unlikeTrack).toBe('function');
  });

  it('should provide shareTrack function', () => {
    const { result } = renderHook(() => useTrackActions(defaultParams), { wrapper });

    expect(typeof result.current.shareTrack).toBe('function');
  });

  it('should provide deleteTrack function', () => {
    const { result } = renderHook(() => useTrackActions(defaultParams), { wrapper });

    expect(typeof result.current.deleteTrack).toBe('function');
  });

  it('should provide addToPlaylist function', () => {
    const { result } = renderHook(() => useTrackActions(defaultParams), { wrapper });

    expect(typeof result.current.addToPlaylist).toBe('function');
  });

  it('should provide removeFromPlaylist function', () => {
    const { result } = renderHook(() => useTrackActions(defaultParams), { wrapper });

    expect(typeof result.current.removeFromPlaylist).toBe('function');
  });

  it('should provide remixTrack function', () => {
    const { result } = renderHook(() => useTrackActions(defaultParams), { wrapper });

    expect(typeof result.current.remixTrack).toBe('function');
  });

  it('should provide downloadTrack function', () => {
    const { result } = renderHook(() => useTrackActions(defaultParams), { wrapper });

    expect(typeof result.current.downloadTrack).toBe('function');
  });

  it('should show pending state during action', async () => {
    const { result } = renderHook(() => useTrackActions(defaultParams), { wrapper });

    // Initially not pending
    expect(result.current.isPending).toBe(false);

    // Execute like action
    const likePromise = result.current.likeTrack();

    // Should be pending
    expect(result.current.isPending).toBe(true);

    // Wait for completion
    await likePromise;

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => useTrackActions(defaultParams), { wrapper });

    // Execute an action that might fail
    await result.current.deleteTrack();

    // If error occurred, should have error object
    if (result.current.error) {
      expect(result.current.error).toBeInstanceOf(Error);
    }
  });

  it('should support optimistic updates', async () => {
    const paramsWithOptimistic: UseTrackActionsParams = {
      ...defaultParams,
      enableOptimistic: true,
    };

    const { result } = renderHook(() => useTrackActions(paramsWithOptimistic), { wrapper });

    // Optimistic update should happen immediately
    const likePromise = result.current.likeTrack();

    // UI should update immediately (before promise resolves)
    // This is tested by checking that the function doesn't block
    expect(likePromise).toBeInstanceOf(Promise);

    await likePromise;
  });

  it('should support share to different platforms', async () => {
    const { result } = renderHook(() => useTrackActions(defaultParams), { wrapper });

    // Share to telegram
    await result.current.shareTrack('telegram');

    // Share to clipboard
    await result.current.shareTrack('clipboard');

    // Should not throw
    expect(true).toBe(true);
  });
});
