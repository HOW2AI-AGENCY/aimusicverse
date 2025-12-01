import { act, renderHook } from '@testing-library/react';
import { usePlayerStore } from './usePlayerState';
import { Track } from '@/hooks/useTracksOptimized';

const mockTrack: Track = {
  id: '1',
  title: 'Test Track',
  audio_url: 'http://example.com/audio.mp3',
  cover_url: 'http://example.com/cover.jpg',
  user_id: 'user-123',
  created_at: '2023-01-01T12:00:00.000Z',
  is_liked: false,
};

describe('usePlayerStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      usePlayerStore.setState({ activeTrack: null, isPlaying: false });
    });
  });

  it('should not change track reference when playing the same track that is paused', () => {
    const { result } = renderHook(() => usePlayerStore());

    // 1. Play a track
    act(() => {
      result.current.playTrack(mockTrack);
    });

    // Hold a reference to the initially set track object
    const initialTrackReference = result.current.activeTrack;
    expect(result.current.isPlaying).toBe(true);

    // 2. Pause the track
    act(() => {
      result.current.pauseTrack();
    });
    expect(result.current.isPlaying).toBe(false);

    // 3. Play the "same" track again, but as a different object reference
    // This simulates the track object coming from a different component or API call
    act(() => {
      result.current.playTrack({ ...mockTrack });
    });

    // THE BUG: The current implementation replaces the activeTrack object,
    // which would cause React to re-mount the player component.
    // This assertion will fail because the store creates a new object instead of just updating isPlaying.
    expect(result.current.activeTrack).toBe(initialTrackReference);
    expect(result.current.isPlaying).toBe(true);
  });

  it('should play a new track when one is already active', () => {
    const { result } = renderHook(() => usePlayerStore());
    const anotherTrack: Track = { ...mockTrack, id: '2', title: 'Another Track' };

    // 1. Play the first track
    act(() => {
      result.current.playTrack(mockTrack);
    });

    // 2. Play a different track
    act(() => {
      result.current.playTrack(anotherTrack);
    });

    // The active track should be the new track
    expect(result.current.activeTrack?.id).toEqual(anotherTrack.id);
    expect(result.current.isPlaying).toBe(true);
  });
});
