/**
 * Integration tests for UnifiedTrackCard component
 *
 * Per contracts/UnifiedTrackCard.contract.ts:
 * - All 7 variants (grid, list, compact, minimal, default, enhanced, professional)
 * - Props and discriminated unions
 * - User interactions (play, like, share, delete)
 * - Variant-specific features
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UnifiedTrackCard } from '@/components/track/track-card';
import type { UnifiedTrackCardProps } from '@/components/track/track-card.types';
import type { Track } from '@/types/track';

// Mock hooks
vi.mock('@/hooks/track/use-track-data', () => ({
  useTrackData: vi.fn(() => ({
    tracks: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/track/use-track-actions', () => ({
  useTrackActions: vi.fn(() => ({
    likeTrack: vi.fn(),
    shareTrack: vi.fn(),
    deleteTrack: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/track/use-track-version-switcher', () => ({
  useTrackVersionSwitcher: vi.fn(() => ({
    activeVersion: { id: 'version-a', version_label: 'A' },
    allVersions: [],
    switchVersion: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/track/use-realtime-track-updates', () => ({
  useRealtimeTrackUpdates: vi.fn(() => ({
    data: null,
    isConnected: true,
    error: null,
  })),
}));

// Mock motion library
vi.mock('@/lib/motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('UnifiedTrackCard', () => {
  const mockTrack: Track = {
    id: 'track-123',
    title: 'Test Track',
    user_id: 'user-123',
    audio_url: 'https://example.com/audio.mp3',
    image_url: 'https://example.com/cover.jpg',
    created_at: new Date().toISOString(),
    is_public: true,
    play_count: 100,
    likes_count: 50,
    active_version_id: 'version-a',
  };

  describe('Variants', () => {
    it('should render grid variant', () => {
      const props: UnifiedTrackCardProps = {
        variant: 'grid',
        track: mockTrack,
        onPlay: vi.fn(),
      };

      render(<UnifiedTrackCard {...props} />);

      // Should render track title
      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });

    it('should render list variant', () => {
      const props: UnifiedTrackCardProps = {
        variant: 'list',
        track: mockTrack,
        onPlay: vi.fn(),
      };

      render(<UnifiedTrackCard {...props} />);

      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });

    it('should render compact variant', () => {
      const props: UnifiedTrackCardProps = {
        variant: 'compact',
        track: mockTrack,
        onPlay: vi.fn(),
      };

      render(<UnifiedTrackCard {...props} />);

      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });

    it('should render minimal variant', () => {
      const props: UnifiedTrackCardProps = {
        variant: 'minimal',
        track: mockTrack,
        onPlay: vi.fn(),
      };

      render(<UnifiedTrackCard {...props} />);

      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });

    it('should render default variant', () => {
      const props: UnifiedTrackCardProps = {
        variant: 'default',
        track: mockTrack,
        onPlay: vi.fn(),
      };

      render(<UnifiedTrackCard {...props} />);

      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });

    it('should render enhanced variant with social features', () => {
      const onFollow = vi.fn();
      const onShare = vi.fn();

      const props: UnifiedTrackCardProps = {
        variant: 'enhanced',
        track: mockTrack,
        onPlay: vi.fn(),
        showFollowButton: true,
        onFollow,
        onShare,
      };

      render(<UnifiedTrackCard {...props} />);

      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });

    it('should render professional variant with MIDI status', () => {
      const props: UnifiedTrackCardProps = {
        variant: 'professional',
        track: mockTrack,
        onPlay: vi.fn(),
        midiStatus: {
          hasMidi: true,
          hasPdf: false,
          hasGp5: false,
        },
        showVersionPills: true,
      };

      render(<UnifiedTrackCard {...props} />);

      expect(screen.getByText('Test Track')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle play button click', () => {
      const onPlay = vi.fn();

      const props: UnifiedTrackCardProps = {
        variant: 'grid',
        track: mockTrack,
        onPlay,
      };

      render(<UnifiedTrackCard {...props} />);

      const playButton = screen.getByRole('button', { name: /play/i });
      fireEvent.click(playButton);

      expect(onPlay).toHaveBeenCalledWith(mockTrack);
    });

    it('should handle like action', async () => {
      const onLike = vi.fn();

      const props: UnifiedTrackCardProps = {
        variant: 'enhanced',
        track: mockTrack,
        onPlay: vi.fn(),
        onLike,
      };

      render(<UnifiedTrackCard {...props} />);

      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(onLike).toHaveBeenCalled();
      });
    });

    it('should handle share action', async () => {
      const onShare = vi.fn();

      const props: UnifiedTrackCardProps = {
        variant: 'enhanced',
        track: mockTrack,
        onPlay: vi.fn(),
        onShare,
      };

      render(<UnifiedTrackCard {...props} />);

      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(onShare).toHaveBeenCalledWith('track-123');
      });
    });

    it('should handle delete action', async () => {
      const onDelete = vi.fn();

      const props: UnifiedTrackCardProps = {
        variant: 'grid',
        track: mockTrack,
        onPlay: vi.fn(),
        onDelete,
      };

      render(<UnifiedTrackCard {...props} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith('track-123');
      });
    });

    it('should handle version switch', async () => {
      const onVersionSwitch = vi.fn();

      const props: UnifiedTrackCardProps = {
        variant: 'grid',
        track: mockTrack,
        onPlay: vi.fn(),
        onVersionSwitch,
      };

      render(<UnifiedTrackCard {...props} />);

      const versionButton = screen.getByRole('button', { name: /version/i });
      fireEvent.click(versionButton);

      await waitFor(() => {
        expect(onVersionSwitch).toHaveBeenCalled();
      });
    });
  });

  describe('Variant-specific features', () => {
    it('should show follow button in enhanced variant', () => {
      const onFollow = vi.fn();

      const props: UnifiedTrackCardProps = {
        variant: 'enhanced',
        track: mockTrack,
        onPlay: vi.fn(),
        showFollowButton: true,
        onFollow,
      };

      render(<UnifiedTrackCard {...props} />);

      const followButton = screen.getByRole('button', { name: /follow/i });
      expect(followButton).toBeInTheDocument();
    });

    it('should show MIDI status in professional variant', () => {
      const props: UnifiedTrackCardProps = {
        variant: 'professional',
        track: mockTrack,
        onPlay: vi.fn(),
        midiStatus: {
          hasMidi: true,
          hasPdf: true,
          hasGp5: false,
        },
      };

      render(<UnifiedTrackCard {...props} />);

      // Should show MIDI indicator
      const midiIndicator = screen.getByText(/midi/i);
      expect(midiIndicator).toBeInTheDocument();
    });

    it('should show version pills in professional variant', () => {
      const props: UnifiedTrackCardProps = {
        variant: 'professional',
        track: mockTrack,
        onPlay: vi.fn(),
        showVersionPills: true,
      };

      render(<UnifiedTrackCard {...props} />);

      // Should show version A/B indicators
      expect(screen.getByText(/A/i)).toBeInTheDocument();
    });

    it('should respect showActions prop', () => {
      const props: UnifiedTrackCardProps = {
        variant: 'grid',
        track: mockTrack,
        onPlay: vi.fn(),
        showActions: false,
      };

      render(<UnifiedTrackCard {...props} />);

      // Action buttons should not be visible
      const likeButton = screen.queryByRole('button', { name: /like/i });
      expect(likeButton).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const props: UnifiedTrackCardProps = {
        variant: 'grid',
        track: mockTrack,
        onPlay: vi.fn(),
      };

      render(<UnifiedTrackCard {...props} />);

      const playButton = screen.getByRole('button', { name: /play/i });
      expect(playButton).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', () => {
      const onPlay = vi.fn();

      const props: UnifiedTrackCardProps = {
        variant: 'grid',
        track: mockTrack,
        onPlay: vi.fn(),
      };

      render(<UnifiedTrackCard {...props} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      // Test Enter key
      fireEvent.keyDown(playButton, { key: 'Enter' });
      expect(onPlay).toHaveBeenCalled();

      // Test Space key
      onPlay.mockClear();
      fireEvent.keyDown(playButton, { key: ' ' });
      expect(onPlay).toHaveBeenCalled();
    });

    it('should have proper touch targets', () => {
      const props: UnifiedTrackCardProps = {
        variant: 'grid',
        track: mockTrack,
        onPlay: vi.fn(),
      };

      render(<UnifiedTrackCard {...props} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      // Touch targets should be at least 44x44px
      const styles = window.getComputedStyle(playButton);
      const height = parseInt(styles.height);
      const width = parseInt(styles.width);

      expect(height).toBeGreaterThanOrEqual(44);
      expect(width).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Type safety', () => {
    it('should enforce variant-specific props', () => {
      // This test verifies TypeScript discriminated unions
      // enhanced variant should accept onFollow
      const enhancedProps: UnifiedTrackCardProps = {
        variant: 'enhanced',
        track: mockTrack,
        onPlay: vi.fn(),
        onFollow: vi.fn(), // ✅ Allowed
      };

      // grid variant should NOT accept onFollow (TypeScript error)
      // @ts-expect-error - onFollow not valid for grid variant
      const gridProps: UnifiedTrackCardProps = {
        variant: 'grid',
        track: mockTrack,
        onPlay: vi.fn(),
        onFollow: vi.fn(), // ❌ Type error
      };

      expect(true).toBe(true);
    });
  });
});
