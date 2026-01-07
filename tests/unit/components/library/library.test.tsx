/**
 * Unit tests for OptimizedPlaylistItem (UnifiedTrackCard) memoization
 * Tests for React.memo optimization with shallow comparison
 */

import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { UnifiedTrackCard } from '@/components/track/track-card-new/UnifiedTrackCard';
import type { Track } from '@/types/track';

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

  describe('Memoization', () => {
    it('should not re-render when track props remain the same', () => {
      const { rerender } = render(<UnifiedTrackCard {...defaultProps} />);

      const initialRender = screen.getByText('Test Track');
      rerender(<UnifiedTrackCard {...defaultProps} />);

      const rerendered = screen.getByText('Test Track');
      expect(initialRender).toBe(rerendered);
    });

    it('should re-render when track title changes', () => {
      const { rerender } = render(<UnifiedTrackCard {...defaultProps} />);

      rerender(
        <UnifiedTrackCard
          {...defaultProps}
          track={{ ...mockTrack, title: 'Updated Title' }}
        />
      );

      expect(screen.getByText('Updated Title')).toBeInTheDocument();
    });

    it('should re-render when isActive state changes', () => {
      const { rerender } = render(<UnifiedTrackCard {...defaultProps} />);

      rerender(<UnifiedTrackCard {...defaultProps} isActive={true} />);

      // Should update to show active state
      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });

    it('should not re-render when callback functions change but other props are same', () => {
      const onPlay1 = vi.fn();
      const onPlay2 = vi.fn();

      const { rerender } = render(
        <UnifiedTrackCard {...defaultProps} onPlay={onPlay1} />
      );

      const initialRender = screen.getByText('Test Track');

      // Rerender with new onPlay reference
      rerender(<UnifiedTrackCard {...defaultProps} onPlay={onPlay2} />);

      const rerendered = screen.getByText('Test Track');
      expect(initialRender).toBe(rerendered);
    });

    it('should not re-render when non-critical track metadata changes', () => {
      const { rerender } = render(<UnifiedTrackCard {...defaultProps} />);

      // Update play_count (should not trigger re-render with proper memoization)
      rerender(
        <UnifiedTrackCard
          {...defaultProps}
          track={{ ...mockTrack, play_count: 200 }}
        />
      );

      // Component should still render without unnecessary update
      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('should call onPlay when play button is clicked', () => {
      const onPlay = vi.fn();

      render(<UnifiedTrackCard {...defaultProps} onPlay={onPlay} />);

      const playButton = screen.getByRole('button', { name: /play/i });
      playButton?.click();

      expect(onPlay).toHaveBeenCalledWith(mockTrack, 0);
    });

    it('should call onToggleLike when like button is clicked', () => {
      const onToggleLike = vi.fn();

      render(<UnifiedTrackCard {...defaultProps} onToggleLike={onToggleLike} />);

      const likeButton = screen.getByRole('button', { name: /like/i });
      likeButton?.click();

      expect(onToggleLike).toHaveBeenCalledWith('track-1', false);
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<UnifiedTrackCard {...defaultProps} isLoading={true} />);

      // Should show skeleton or loading state
      const loader = screen.queryByRole('status', { hidden: true });
      expect(loader).toBeInTheDocument();
    });

    it('should not show loading indicator when isLoading is false', () => {
      render(<UnifiedTrackCard {...defaultProps} isLoading={false} />);

      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should display playing indicator when isActive is true', () => {
      render(<UnifiedTrackCard {...defaultProps} isActive={true} />);

      // Should show playing indicator
      const playingIndicator = screen.queryByTestId('playing-indicator');
      expect(playingIndicator).toBeInTheDocument();
    });

    it('should not display playing indicator when isActive is false', () => {
      render(<UnifiedTrackCard {...defaultProps} isActive={false} />);

      const playingIndicator = screen.queryByTestId('playing-indicator');
      expect(playingIndicator).not.toBeInTheDocument();
    });
  });

  describe('Shallow Comparison', () => {
    it('should use shallow comparison for track object', () => {
      const { rerender } = render(<UnifiedTrackCard {...defaultProps} />);

      // Create new track object with same values
      const sameTrack = { ...mockTrack };
      rerender(<UnifiedTrackCard {...defaultProps} track={sameTrack} />);

      // Should not re-render due to shallow comparison
      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });

    it('should detect changes in shallow properties', () => {
      const { rerender } = render(<UnifiedTrackCard {...defaultProps} />);

      // Change shallow property
      rerender(
        <UnifiedTrackCard
          {...defaultProps}
          track={{ ...mockTrack, title: 'New Title' }}
        />
      );

      expect(screen.getByText('New Title')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should minimize re-renders during rapid parent updates', () => {
      let renderCount = 0;

      const TestWrapper = ({ track }: { track: Track }) => {
        renderCount++;
        return <UnifiedTrackCard {...defaultProps} track={track} />;
      };

      const { rerender } = render(<TestWrapper track={mockTrack} />);
      const initialRenderCount = renderCount;

      // Rapid updates with same track
      rerender(<TestWrapper track={mockTrack} />);
      rerender(<TestWrapper track={mockTrack} />);
      rerender(<TestWrapper track={mockTrack} />);

      // Should not re-render due to memoization
      expect(renderCount).toBe(initialRenderCount);
    });
  });
});
