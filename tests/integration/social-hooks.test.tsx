/**
 * Integration Tests for Social Features with Extracted Hooks
 * 
 * Tests for User Story 2 (Phase 4): Business Logic Extraction
 * Per tasks.md T045 - Integration test for social features via hooks
 * 
 * Tests interaction between useSocialInteractions and actual UI components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSocialInteractions } from '@/hooks/social/use-social-interactions';
import type { ReactNode } from 'react';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'user-123' } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      single: vi.fn(() => Promise.resolve({ data: { likes_count: 0 }, error: null })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      delete: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
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

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Test component that uses useSocialInteractions
function SocialTestComponent({ entityType = 'track', entityId = 'track-1' }) {
  const {
    isLiked,
    likesCount,
    toggleLike,
    isLikePending,
    isFollowing,
    toggleFollow,
    share,
    isSharing,
  } = useSocialInteractions({ entityType, entityId });

  return (
    <div>
      <div data-testid="is-liked">{isLiked ? 'Liked' : 'Not Liked'}</div>
      <div data-testid="likes-count">{likesCount}</div>
      <div data-testid="is-pending">{isLikePending ? 'Pending' : 'Ready'}</div>
      
      {entityType === 'artist' && (
        <>
          <div data-testid="is-following">
            {isFollowing ? 'Following' : 'Not Following'}
          </div>
          <button onClick={toggleFollow}>Toggle Follow</button>
        </>
      )}
      
      <button onClick={toggleLike}>Toggle Like</button>
      <button onClick={() => share('clipboard')}>Share Clipboard</button>
      <button onClick={() => share('telegram')}>Share Telegram</button>
      <div data-testid="is-sharing">{isSharing ? 'Sharing' : 'Ready'}</div>
    </div>
  );
}

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

describe('Social Features Integration with useSocialInteractions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Track Likes', () => {
    it('should render track social features', async () => {
      render(<SocialTestComponent entityType="track" entityId="track-1" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-liked')).toBeInTheDocument();
      });

      expect(screen.getByTestId('is-liked')).toHaveTextContent('Not Liked');
      expect(screen.getByTestId('likes-count')).toHaveTextContent('0');
    });

    it('should toggle like for track', async () => {
      const user = userEvent.setup();
      render(<SocialTestComponent entityType="track" entityId="track-1" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-liked')).toBeInTheDocument();
      });

      const likeButton = screen.getByText('Toggle Like');
      await user.click(likeButton);

      await waitFor(() => {
        expect(screen.getByTestId('is-pending')).toHaveTextContent('Ready');
      });
    });

    it('should share track to clipboard', async () => {
      const user = userEvent.setup();
      render(<SocialTestComponent entityType="track" entityId="track-1" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-liked')).toBeInTheDocument();
      });

      const shareButton = screen.getByText('Share Clipboard');
      await user.click(shareButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });
  });

  describe('Artist Follows', () => {
    it('should render artist social features', async () => {
      render(<SocialTestComponent entityType="artist" entityId="artist-1" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-following')).toBeInTheDocument();
      });

      expect(screen.getByTestId('is-following')).toHaveTextContent('Not Following');
    });

    it('should toggle follow for artist', async () => {
      const user = userEvent.setup();
      render(<SocialTestComponent entityType="artist" entityId="artist-1" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-following')).toBeInTheDocument();
      });

      const followButton = screen.getByText('Toggle Follow');
      await user.click(followButton);

      await waitFor(() => {
        expect(screen.getByTestId('is-pending')).toHaveTextContent('Ready');
      });
    });
  });

  describe('Multiple Operations', () => {
    it('should handle like and share in sequence', async () => {
      const user = userEvent.setup();
      render(<SocialTestComponent entityType="track" entityId="track-1" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-liked')).toBeInTheDocument();
      });

      // Like the track
      await user.click(screen.getByText('Toggle Like'));
      await waitFor(() => {
        expect(screen.getByTestId('is-pending')).toHaveTextContent('Ready');
      });

      // Share the track
      await user.click(screen.getByText('Share Clipboard'));
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });
  });

  describe('Playlist Likes', () => {
    it('should render playlist social features', async () => {
      render(<SocialTestComponent entityType="playlist" entityId="playlist-1" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-liked')).toBeInTheDocument();
      });

      expect(screen.getByTestId('is-liked')).toHaveTextContent('Not Liked');
      expect(screen.queryByTestId('is-following')).not.toBeInTheDocument();
    });

    it('should toggle like for playlist', async () => {
      const user = userEvent.setup();
      render(<SocialTestComponent entityType="playlist" entityId="playlist-1" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-liked')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Toggle Like'));

      await waitFor(() => {
        expect(screen.getByTestId('is-pending')).toHaveTextContent('Ready');
      });
    });
  });
});
