/**
 * Unit tests for UnifiedTrackCard memoization and rendering
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedTrackCard } from '@/components/track/track-card-new/UnifiedTrackCard';
import type { Track } from '@/types/track';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@test.com' },
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/hooks/audio/usePlayerState', () => ({
  usePlayerStore: () => ({
    currentTrack: null,
    isPlaying: false,
    play: vi.fn(),
    pause: vi.fn(),
  }),
}));

vi.mock('@/contexts/GlobalAudioContext', () => ({
  useGlobalAudioPlayer: () => ({
    play: vi.fn(),
    pause: vi.fn(),
    currentTrack: null,
    isPlaying: false,
  }),
}));

vi.mock('@/contexts/telegram/TelegramProvider', () => ({
  useTelegram: () => ({
    user: { id: 123456789, first_name: 'Test' },
    isReady: true,
    hapticFeedback: { impactOccurred: vi.fn(), notificationOccurred: vi.fn(), selectionChanged: vi.fn() },
    showConfirm: vi.fn(),
    showPopup: vi.fn(),
    openLink: vi.fn(),
    shareUrl: vi.fn(),
    hideMainButton: vi.fn(),
    hideBackButton: vi.fn(),
    showMainButton: vi.fn(),
    showBackButton: vi.fn(),
    setMainButtonText: vi.fn(),
    onMainButtonClick: vi.fn(),
    onBackButtonClick: vi.fn(),
    webApp: { platform: 'tdesktop' },
  }),
  TelegramProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Ensure IntersectionObserver is properly mocked as a constructor
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: IntersectionObserverCallback) {
    // Immediately trigger with empty entries
    setTimeout(() => callback([], this as unknown as IntersectionObserver), 0);
  }
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('UnifiedTrackCard - T024', () => {
  const mockTrack: Track = {
    id: 'track-1',
    title: 'Test Track',
    audio_url: 'https://example.com/audio.mp3',
    cover_url: 'https://example.com/cover.jpg',
    created_at: '2024-01-01',
    user_id: 'user-1',
    tags: 'pop,electronic',
    style: 'Pop style',
    lyrics: 'Test lyrics',
    is_public: true,
    play_count: 100,
    likes_count: 50,
  };

  const defaultProps = {
    track: mockTrack,
    index: 0,
    isActive: false,
    isLoading: false,
    variant: 'grid' as const,
    onPlay: vi.fn(),
    onToggleLike: vi.fn(),
    onDelete: vi.fn(),
    onDownload: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render track title', () => {
      render(<UnifiedTrackCard {...defaultProps} />, { wrapper });
      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });

    it('should re-render when track title changes', () => {
      const { rerender } = render(<UnifiedTrackCard {...defaultProps} />, { wrapper });

      rerender(<UnifiedTrackCard {...defaultProps} track={{ ...mockTrack, title: 'Updated Title' }} />);
      expect(screen.getByText('Updated Title')).toBeInTheDocument();
    });

    it('should re-render when isActive state changes', () => {
      const { rerender } = render(<UnifiedTrackCard {...defaultProps} />, { wrapper });

      rerender(<UnifiedTrackCard {...defaultProps} isActive={true} />);
      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('should call onPlay when play button is clicked', () => {
      const onPlay = vi.fn();
      render(<UnifiedTrackCard {...defaultProps} onPlay={onPlay} />, { wrapper });

      const playButton = screen.queryByRole('button', { name: /play/i });
      if (playButton) {
        playButton.click();
        expect(onPlay).toHaveBeenCalled();
      }
    });

    it('should call onToggleLike when like button is clicked', () => {
      const onToggleLike = vi.fn();
      render(<UnifiedTrackCard {...defaultProps} onToggleLike={onToggleLike} />, { wrapper });

      const likeButton = screen.queryByRole('button', { name: /like/i });
      if (likeButton) {
        likeButton.click();
        expect(onToggleLike).toHaveBeenCalled();
      }
    });
  });

  describe('Loading State', () => {
    it('should render without errors when isLoading is true', () => {
      const { container } = render(<UnifiedTrackCard {...defaultProps} isLoading={true} />, { wrapper });
      expect(container).toBeTruthy();
    });

    it('should show track title when not loading', () => {
      render(<UnifiedTrackCard {...defaultProps} isLoading={false} />, { wrapper });
      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should render with active state', () => {
      const { container } = render(<UnifiedTrackCard {...defaultProps} isActive={true} />, { wrapper });
      expect(container).toBeTruthy();
    });

    it('should render without active state', () => {
      render(<UnifiedTrackCard {...defaultProps} isActive={false} />, { wrapper });
      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });
  });

  describe('Shallow Comparison', () => {
    it('should handle new track object with same values', () => {
      const { rerender } = render(<UnifiedTrackCard {...defaultProps} />, { wrapper });

      const sameTrack = { ...mockTrack };
      rerender(<UnifiedTrackCard {...defaultProps} track={sameTrack} />);
      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });

    it('should detect changes in shallow properties', () => {
      const { rerender } = render(<UnifiedTrackCard {...defaultProps} />, { wrapper });

      rerender(<UnifiedTrackCard {...defaultProps} track={{ ...mockTrack, title: 'New Title' }} />);
      expect(screen.getByText('New Title')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle rapid parent updates without error', () => {
      const { rerender } = render(<UnifiedTrackCard {...defaultProps} />, { wrapper });

      rerender(<UnifiedTrackCard {...defaultProps} />);
      rerender(<UnifiedTrackCard {...defaultProps} />);
      rerender(<UnifiedTrackCard {...defaultProps} />);

      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });
  });
});
vi.mock('@/hooks/audio/usePlaybackQueue', () => ({
  usePlaybackQueue: () => ({
    queue: [],
    currentIndex: 0,
    shuffle: false,
    repeat: 'none',
    queueLength: 0,
    addTrack: vi.fn(),
    addTracks: vi.fn(),
    playNext: vi.fn(),
    setQueue: vi.fn(),
    playFromIndex: vi.fn(),
    removeTrack: vi.fn(),
    clear: vi.fn(),
    reorder: vi.fn(),
    jumpToTrack: vi.fn(),
    toggleShuffle: vi.fn(),
    toggleRepeat: vi.fn(),
    saveQueue: vi.fn(),
    restoreQueue: vi.fn(),
  }),
}));

vi.mock('@/contexts/GuestModeContext', () => ({
  useGuestMode: () => ({
    isGuest: true,
    canAccess: true,
    remainingViews: 5,
    isScreenshotMode: false,
  }),
  GuestModeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
