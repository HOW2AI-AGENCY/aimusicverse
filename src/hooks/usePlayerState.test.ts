import { act, renderHook } from '@testing-library/react';
import { usePlayerStore, playerLogic } from './usePlayerState';
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
    act(() => {
      usePlayerStore.setState({ activeTrack: null, isPlaying: false });
    });
  });

  it('should not change track reference when playing the same track that is paused', () => {
    const { result } = renderHook(() => usePlayerStore());
    act(() => {
      result.current.playTrack(mockTrack);
    });
    const initialTrackReference = result.current.activeTrack;
    expect(result.current.isPlaying).toBe(true);
    act(() => {
      result.current.pauseTrack();
    });
    expect(result.current.isPlaying).toBe(false);
    act(() => {
      result.current.playTrack({ ...mockTrack });
    });
    expect(result.current.activeTrack).toBe(initialTrackReference);
    expect(result.current.isPlaying).toBe(true);
  });

  it('should play a new track when one is already active', () => {
    const { result } = renderHook(() => usePlayerStore());
    const anotherTrack: Track = { ...mockTrack, id: '2', title: 'Another Track' };
    act(() => {
      result.current.playTrack(mockTrack);
    });
    act(() => {
      result.current.playTrack(anotherTrack);
    });
    expect(result.current.activeTrack?.id).toEqual(anotherTrack.id);
    expect(result.current.isPlaying).toBe(true);
  });

  it('should do nothing if the same track is played while already playing', () => {
    const { result } = renderHook(() => usePlayerStore());
    act(() => {
      result.current.playTrack(mockTrack);
    });
    const initialTrackReference = result.current.activeTrack;
    expect(result.current.isPlaying).toBe(true);
    act(() => {
      result.current.playTrack({ ...mockTrack });
    });
    expect(result.current.activeTrack).toBe(initialTrackReference);
    expect(result.current.isPlaying).toBe(true);
  });
});

describe('playerLogic', () => {
  it('should set isPlaying to true for a paused track', () => {
    const set = jest.fn();
    const get = jest.fn(() => ({ activeTrack: mockTrack, isPlaying: false }));
    playerLogic.playTrack(set, get, mockTrack);
    expect(set).toHaveBeenCalledWith({ isPlaying: true });
  });

  it('should set a new active track', () => {
    const set = jest.fn();
    const get = jest.fn(() => ({ activeTrack: null, isPlaying: false }));
    const newTrack = { ...mockTrack, id: '2' };
    playerLogic.playTrack(set, get, newTrack);
    expect(set).toHaveBeenCalledWith({ activeTrack: newTrack, isPlaying: true });
  });

  it('should do nothing if the same track is already playing', () => {
    const set = jest.fn();
    const get = jest.fn(() => ({ activeTrack: mockTrack, isPlaying: true }));
    playerLogic.playTrack(set, get, mockTrack);
    expect(set).not.toHaveBeenCalled();
  });
});
