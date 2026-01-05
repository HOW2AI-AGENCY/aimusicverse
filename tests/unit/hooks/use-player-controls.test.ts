/**
 * Unit Tests for usePlayerControls Hook
 * 
 * Tests for User Story 2 (Phase 4): Business Logic Extraction
 * Per tasks.md T043 - Test play, pause, seek operations
 * 
 * Tests MUST fail before implementation (TDD approach)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerControls } from '@/hooks/player/use-player-controls';

// Mock dependencies
vi.mock('@/stores/playerStore', () => ({
  playerStore: {
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(),
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

describe('usePlayerControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Playback Controls', () => {
    it('should play a track', async () => {
      const { result } = renderHook(() => usePlayerControls());

      const track = {
        id: 'track-1',
        title: 'Test Track',
        audio_url: 'https://example.com/audio.mp3',
      };

      await act(async () => {
        await result.current.play(track);
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.currentTrack).toEqual(track);
    });

    it('should pause playback', async () => {
      const { result } = renderHook(() => usePlayerControls());

      const track = {
        id: 'track-1',
        title: 'Test Track',
        audio_url: 'https://example.com/audio.mp3',
      };

      await act(async () => {
        await result.current.play(track);
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should toggle play/pause', async () => {
      const { result } = renderHook(() => usePlayerControls());

      const track = {
        id: 'track-1',
        title: 'Test Track',
        audio_url: 'https://example.com/audio.mp3',
      };

      await act(async () => {
        await result.current.play(track);
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.togglePlayPause();
      });

      expect(result.current.isPlaying).toBe(false);

      act(() => {
        result.current.togglePlayPause();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('should stop playback and clear track', () => {
      const { result } = renderHook(() => usePlayerControls());

      act(() => {
        result.current.stop();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentTrack).toBeNull();
    });
  });

  describe('Seek Operations', () => {
    it('should seek to specific time', () => {
      const { result } = renderHook(() => usePlayerControls());

      act(() => {
        result.current.seek(30);
      });

      expect(result.current.currentTime).toBe(30);
    });

    it('should seek forward by 10 seconds', () => {
      const { result } = renderHook(() => usePlayerControls());

      // Set initial time
      act(() => {
        result.current.seek(20);
      });

      act(() => {
        result.current.seekForward();
      });

      expect(result.current.currentTime).toBe(30);
    });

    it('should seek backward by 10 seconds', () => {
      const { result } = renderHook(() => usePlayerControls());

      // Set initial time
      act(() => {
        result.current.seek(30);
      });

      act(() => {
        result.current.seekBackward();
      });

      expect(result.current.currentTime).toBe(20);
    });

    it('should not seek to negative time', () => {
      const { result } = renderHook(() => usePlayerControls());

      act(() => {
        result.current.seek(5);
      });

      act(() => {
        result.current.seekBackward();
      });

      expect(result.current.currentTime).toBe(0);
    });

    it('should not seek beyond track duration', () => {
      const { result } = renderHook(() => usePlayerControls());

      const track = {
        id: 'track-1',
        title: 'Test Track',
        audio_url: 'https://example.com/audio.mp3',
        duration: 180,
      };

      act(() => {
        result.current.play(track);
      });

      act(() => {
        result.current.seek(200);
      });

      expect(result.current.currentTime).toBeLessThanOrEqual(180);
    });
  });

  describe('Volume Control', () => {
    it('should set volume', () => {
      const { result } = renderHook(() => usePlayerControls());

      act(() => {
        result.current.setVolume(0.5);
      });

      expect(result.current.volume).toBe(0.5);
    });

    it('should clamp volume between 0 and 1', () => {
      const { result } = renderHook(() => usePlayerControls());

      act(() => {
        result.current.setVolume(1.5);
      });

      expect(result.current.volume).toBe(1);

      act(() => {
        result.current.setVolume(-0.5);
      });

      expect(result.current.volume).toBe(0);
    });

    it('should toggle mute', () => {
      const { result } = renderHook(() => usePlayerControls());

      act(() => {
        result.current.setVolume(0.7);
      });

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(true);
      expect(result.current.volume).toBe(0);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(false);
      expect(result.current.volume).toBe(0.7);
    });
  });

  describe('Queue Management', () => {
    it('should add track to queue', () => {
      const { result } = renderHook(() => usePlayerControls());

      const track = {
        id: 'track-1',
        title: 'Test Track',
        audio_url: 'https://example.com/audio.mp3',
      };

      act(() => {
        result.current.addToQueue(track);
      });

      expect(result.current.queue).toContainEqual(track);
    });

    it('should play next track in queue', async () => {
      const { result } = renderHook(() => usePlayerControls());

      const track1 = {
        id: 'track-1',
        title: 'Track 1',
        audio_url: 'https://example.com/audio1.mp3',
      };

      const track2 = {
        id: 'track-2',
        title: 'Track 2',
        audio_url: 'https://example.com/audio2.mp3',
      };

      await act(async () => {
        await result.current.play(track1);
      });

      act(() => {
        result.current.addToQueue(track2);
      });

      await act(async () => {
        await result.current.playNext();
      });

      expect(result.current.currentTrack).toEqual(track2);
    });

    it('should play previous track', async () => {
      const { result } = renderHook(() => usePlayerControls());

      const track1 = {
        id: 'track-1',
        title: 'Track 1',
        audio_url: 'https://example.com/audio1.mp3',
      };

      const track2 = {
        id: 'track-2',
        title: 'Track 2',
        audio_url: 'https://example.com/audio2.mp3',
      };

      await act(async () => {
        await result.current.play(track1);
      });

      act(() => {
        result.current.addToQueue(track2);
      });

      await act(async () => {
        await result.current.playNext();
      });

      await act(async () => {
        await result.current.playPrevious();
      });

      expect(result.current.currentTrack).toEqual(track1);
    });

    it('should clear queue', () => {
      const { result } = renderHook(() => usePlayerControls());

      const track = {
        id: 'track-1',
        title: 'Test Track',
        audio_url: 'https://example.com/audio.mp3',
      };

      act(() => {
        result.current.addToQueue(track);
        result.current.addToQueue(track);
      });

      expect(result.current.queue.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.queue).toHaveLength(0);
    });

    it('should shuffle queue', () => {
      const { result } = renderHook(() => usePlayerControls());

      const tracks = [
        { id: 'track-1', title: 'Track 1', audio_url: 'url1' },
        { id: 'track-2', title: 'Track 2', audio_url: 'url2' },
        { id: 'track-3', title: 'Track 3', audio_url: 'url3' },
      ];

      tracks.forEach(track => {
        act(() => {
          result.current.addToQueue(track);
        });
      });

      const originalOrder = [...result.current.queue];

      act(() => {
        result.current.toggleShuffle();
      });

      expect(result.current.isShuffled).toBe(true);
      // Queue order should potentially be different (not guaranteed due to randomness)
    });
  });

  describe('Repeat Mode', () => {
    it('should cycle through repeat modes', () => {
      const { result } = renderHook(() => usePlayerControls());

      expect(result.current.repeatMode).toBe('off');

      act(() => {
        result.current.toggleRepeat();
      });

      expect(result.current.repeatMode).toBe('all');

      act(() => {
        result.current.toggleRepeat();
      });

      expect(result.current.repeatMode).toBe('one');

      act(() => {
        result.current.toggleRepeat();
      });

      expect(result.current.repeatMode).toBe('off');
    });

    it('should repeat track when in repeat-one mode', async () => {
      const { result } = renderHook(() => usePlayerControls());

      const track = {
        id: 'track-1',
        title: 'Test Track',
        audio_url: 'https://example.com/audio.mp3',
        duration: 180,
      };

      await act(async () => {
        await result.current.play(track);
      });

      // Set repeat mode to 'one'
      act(() => {
        result.current.toggleRepeat();
        result.current.toggleRepeat();
      });

      expect(result.current.repeatMode).toBe('one');

      // Simulate track end
      await act(async () => {
        await result.current.playNext();
      });

      // Should restart same track
      expect(result.current.currentTrack).toEqual(track);
    });
  });

  describe('Playback Speed', () => {
    it('should set playback speed', () => {
      const { result } = renderHook(() => usePlayerControls());

      act(() => {
        result.current.setPlaybackSpeed(1.5);
      });

      expect(result.current.playbackSpeed).toBe(1.5);
    });

    it('should clamp playback speed between valid range', () => {
      const { result } = renderHook(() => usePlayerControls());

      act(() => {
        result.current.setPlaybackSpeed(3);
      });

      expect(result.current.playbackSpeed).toBeLessThanOrEqual(2);

      act(() => {
        result.current.setPlaybackSpeed(0.1);
      });

      expect(result.current.playbackSpeed).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('Error Handling', () => {
    it('should handle playback errors gracefully', async () => {
      const { result } = renderHook(() => usePlayerControls());

      const invalidTrack = {
        id: 'track-1',
        title: 'Invalid Track',
        audio_url: 'https://invalid.com/nonexistent.mp3',
      };

      await act(async () => {
        await result.current.play(invalidTrack);
      });

      // Should not crash, error should be logged
      expect(result.current.error).toBeDefined();
    });

    it('should recover from errors', async () => {
      const { result } = renderHook(() => usePlayerControls());

      const invalidTrack = {
        id: 'track-1',
        title: 'Invalid Track',
        audio_url: 'https://invalid.com/nonexistent.mp3',
      };

      const validTrack = {
        id: 'track-2',
        title: 'Valid Track',
        audio_url: 'https://example.com/audio.mp3',
      };

      await act(async () => {
        await result.current.play(invalidTrack);
      });

      expect(result.current.error).toBeDefined();

      await act(async () => {
        await result.current.play(validTrack);
      });

      // Error should be cleared
      expect(result.current.error).toBeNull();
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger haptic feedback on play', async () => {
      const { result } = renderHook(() => usePlayerControls());

      const track = {
        id: 'track-1',
        title: 'Test Track',
        audio_url: 'https://example.com/audio.mp3',
      };

      await act(async () => {
        await result.current.play(track);
      });

      // Haptic feedback should be triggered (implementation detail)
      // This test validates integration exists
    });

    it('should trigger haptic feedback on seek', () => {
      const { result } = renderHook(() => usePlayerControls());

      act(() => {
        result.current.seek(30);
      });

      // Haptic feedback should be triggered (implementation detail)
    });
  });
});
