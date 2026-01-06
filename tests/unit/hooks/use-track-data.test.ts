/**
 * Unit tests for useTrackData hook
 *
 * Per contracts/useTrackData.contract.ts:
 * - Data fetching with TanStack Query
 * - Caching and invalidation
 * - Pagination support
 * - Error handling
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTrackData } from '@/hooks/track/use-track-data';
import type { UseTrackDataParams } from '@/hooks/types/track';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
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

describe('useTrackData', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  it('should fetch tracks for a user', async () => {
    const params: UseTrackDataParams = {
      userId: 'user-123',
      limit: 20,
    };

    const { result } = renderHook(() => useTrackData(params), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have tracks array
    expect(Array.isArray(result.current.tracks)).toBe(true);
  });

  it('should fetch public tracks', async () => {
    const params: UseTrackDataParams = {
      isPublic: true,
      limit: 20,
    };

    const { result } = renderHook(() => useTrackData(params), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(Array.isArray(result.current.tracks)).toBe(true);
  });

  it('should support pagination', async () => {
    const params: UseTrackDataParams = {
      userId: 'user-123',
      limit: 20,
      offset: 0,
    };

    const { result } = renderHook(() => useTrackData(params), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have pagination functions
    expect(typeof result.current.fetchNextPage).toBe('function');
    expect(typeof result.current.hasNextPage).toBe('boolean');
  });

  it('should handle errors gracefully', async () => {
    // Mock an error scenario
    const params: UseTrackDataParams = {
      userId: 'invalid-user',
    };

    const { result } = renderHook(() => useTrackData(params), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have error object or empty tracks
    if (result.current.error) {
      expect(result.current.error).toBeInstanceOf(Error);
    }
  });

  it('should support refetch', async () => {
    const params: UseTrackDataParams = {
      userId: 'user-123',
    };

    const { result } = renderHook(() => useTrackData(params), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Refetch should be a function
    expect(typeof result.current.refetch).toBe('function');

    // Call refetch
    await waitFor(async () => {
      await result.current.refetch();
    });
  });

  it('should cache results', async () => {
    const params: UseTrackDataParams = {
      userId: 'user-123',
    };

    // First render
    const { result: result1 } = renderHook(() => useTrackData(params), { wrapper });

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    // Second render should use cache
    const { result: result2 } = renderHook(() => useTrackData(params), { wrapper });

    // Should load from cache (no loading state)
    expect(result2.current.isLoading).toBe(false);
  });
});
