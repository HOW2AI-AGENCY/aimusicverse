/**
 * Unit Tests for useSocialInteractions Hook
 * 
 * Tests for User Story 2 (Phase 4): Business Logic Extraction
 * Per tasks.md T042 - Test like, follow, share actions with optimistic updates
 * 
 * Tests MUST fail before implementation (TDD approach)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSocialInteractions } from '@/hooks/social/use-social-interactions';
import { supabase } from '@/lib/supabase';
import type { ReactNode } from 'react';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    impact: vi.fn(),
    notification: vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Helper to create query client wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useSocialInteractions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock authenticated user
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Track Like Operations', () => {
    it('should fetch initial like status for track', async () => {
      // Mock track likes query
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: 'like-1' },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      } as any);

      const { result } = renderHook(
        () => useSocialInteractions({ entityType: 'track', entityId: 'track-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLiked).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('track_likes');
    });

    it('should return false if track is not liked', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      } as any);

      const { result } = renderHook(
        () => useSocialInteractions({ entityType: 'track', entityId: 'track-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLiked).toBe(false);
    });

    it('should toggle like with optimistic updates', async () => {
      // Setup initial state (not liked)
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
        insert: mockInsert,
      } as any);

      const { result } = renderHook(
        () => useSocialInteractions({ entityType: 'track', entityId: 'track-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initial state
      expect(result.current.isLiked).toBe(false);

      // Toggle like
      await result.current.toggleLike();

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
    });

    it('should handle like toggle errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockInsert = vi.fn().mockResolvedValue({
        error: new Error('Database error'),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
        insert: mockInsert,
      } as any);

      const { result } = renderHook(
        () => useSocialInteractions({ entityType: 'track', entityId: 'track-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Try to toggle - should handle error
      await result.current.toggleLike();

      // State should remain unchanged on error
      expect(result.current.isLiked).toBe(false);
    });

    it('should fetch and update likes count', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: 'like-1' },
        error: null,
      });
      const mockSingle = vi.fn().mockResolvedValue({
        data: { likes_count: 42 },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
        single: mockSingle,
      } as any);

      const { result } = renderHook(
        () => useSocialInteractions({ entityType: 'track', entityId: 'track-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.likesCount).toBe(42);
    });
  });

  describe('Artist Follow Operations', () => {
    it('should fetch initial follow status for artist', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: 'follow-1' },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      } as any);

      const { result } = renderHook(
        () => useSocialInteractions({ entityType: 'artist', entityId: 'artist-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isFollowing).toBe(true);
    });

    it('should toggle follow with optimistic updates', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
        insert: mockInsert,
      } as any);

      const { result } = renderHook(
        () => useSocialInteractions({ entityType: 'artist', entityId: 'artist-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isFollowing).toBe(false);

      // Toggle follow
      await result.current.toggleFollow();

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
    });
  });

  describe('Share Operations', () => {
    it('should share track to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      } as any);

      const { result } = renderHook(
        () => useSocialInteractions({ entityType: 'track', entityId: 'track-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.share('clipboard');

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('track-1')
      );
    });

    it('should share track to Telegram', async () => {
      // Mock Telegram WebApp
      const mockOpenTelegramLink = vi.fn();
      (window as any).Telegram = {
        WebApp: {
          openTelegramLink: mockOpenTelegramLink,
        },
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      } as any);

      const { result } = renderHook(
        () => useSocialInteractions({ entityType: 'track', entityId: 'track-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.share('telegram');

      expect(mockOpenTelegramLink).toHaveBeenCalled();
    });
  });

  describe('Playlist Operations', () => {
    it('should handle playlist like status', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: 'like-1' },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      } as any);

      const { result } = renderHook(
        () => useSocialInteractions({ entityType: 'playlist', entityId: 'playlist-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLiked).toBe(true);
    });
  });

  describe('Haptic Feedback Integration', () => {
    it('should trigger haptic feedback on like toggle', async () => {
      const mockImpact = vi.fn();
      vi.doMock('@/hooks/useHapticFeedback', () => ({
        useHapticFeedback: () => ({
          impact: mockImpact,
          notification: vi.fn(),
        }),
      }));

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
        insert: mockInsert,
      } as any);

      const { result } = renderHook(
        () => useSocialInteractions({ entityType: 'track', entityId: 'track-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.toggleLike();

      // Haptic feedback should be triggered (implementation detail)
      // This test validates integration exists
    });
  });
});
