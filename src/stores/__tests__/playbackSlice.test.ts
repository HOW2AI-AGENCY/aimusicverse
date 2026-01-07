/**
 * Unit tests for playbackSlice
 */

import { createPlaybackSlice, selectPlaybackStatus, selectLoopState, selectProgress } from '../slices/playbackSlice';
import type { LoopMode } from '../slices/playbackSlice';

describe('playbackSlice', () => {
  const createTestStore = () => {
    let state: ReturnType<typeof createPlaybackSlice>;
    const set = (fn: ((s: typeof state) => Partial<typeof state>) | Partial<typeof state>) => {
      const update = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...update };
    };
    const get = () => state;
    state = createPlaybackSlice(set as any, get as any, {} as any);
    return { get, set };
  };

  describe('play/pause controls', () => {
    it('should start in paused state', () => {
      const { get } = createTestStore();
      expect(get().isPlaying).toBe(false);
    });

    it('should play when play is called', () => {
      const { get } = createTestStore();
      get().play();
      expect(get().isPlaying).toBe(true);
    });

    it('should pause when pause is called', () => {
      const { get } = createTestStore();
      get().play();
      get().pause();
      expect(get().isPlaying).toBe(false);
    });

    it('should toggle play state', () => {
      const { get } = createTestStore();
      expect(get().isPlaying).toBe(false);
      get().togglePlay();
      expect(get().isPlaying).toBe(true);
      get().togglePlay();
      expect(get().isPlaying).toBe(false);
    });
  });

  describe('time management', () => {
    it('should set current time', () => {
      const { get } = createTestStore();
      get().setCurrentTime(30.5);
      expect(get().currentTime).toBe(30.5);
    });

    it('should set duration', () => {
      const { get } = createTestStore();
      get().setDuration(180);
      expect(get().duration).toBe(180);
    });

    it('should not allow negative duration', () => {
      const { get } = createTestStore();
      get().setDuration(-10);
      expect(get().duration).toBe(0);
    });

    it('should seek to specific time', () => {
      const { get } = createTestStore();
      get().setDuration(100);
      get().seek(50);
      expect(get().currentTime).toBe(50);
    });

    it('should clamp seek to duration', () => {
      const { get } = createTestStore();
      get().setDuration(100);
      get().seek(150);
      expect(get().currentTime).toBe(100);
    });

    it('should not seek below 0', () => {
      const { get } = createTestStore();
      get().setDuration(100);
      get().seek(-10);
      expect(get().currentTime).toBe(0);
    });
  });

  describe('loop controls', () => {
    it('should start with loop none', () => {
      const { get } = createTestStore();
      expect(get().loopMode).toBe('none');
    });

    it('should set loop mode', () => {
      const { get } = createTestStore();
      get().setLoopMode('all');
      expect(get().loopMode).toBe('all');
      
      get().setLoopMode('one');
      expect(get().loopMode).toBe('one');
    });

    it('should set loop region', () => {
      const { get } = createTestStore();
      get().setLoopRegion({ start: 10, end: 30 });
      expect(get().loopRegion).toEqual({ start: 10, end: 30 });
    });

    it('should clear loop region', () => {
      const { get } = createTestStore();
      get().setLoopRegion({ start: 10, end: 30 });
      get().setLoopRegion(null);
      expect(get().loopRegion).toBeNull();
    });

    it('should cycle loop modes', () => {
      const { get } = createTestStore();
      expect(get().loopMode).toBe('none');
      
      get().cycleLoopMode();
      expect(get().loopMode).toBe('all');
      
      get().cycleLoopMode();
      expect(get().loopMode).toBe('one');
      
      get().cycleLoopMode();
      expect(get().loopMode).toBe('none');
    });
  });

  describe('buffering/seeking states', () => {
    it('should set buffering state', () => {
      const { get } = createTestStore();
      get().setIsBuffering(true);
      expect(get().isBuffering).toBe(true);
      
      get().setIsBuffering(false);
      expect(get().isBuffering).toBe(false);
    });

    it('should set seeking state', () => {
      const { get } = createTestStore();
      get().setIsSeeking(true);
      expect(get().isSeeking).toBe(true);
      
      get().setIsSeeking(false);
      expect(get().isSeeking).toBe(false);
    });
  });

  describe('skip controls', () => {
    it('should skip forward by default 10 seconds', () => {
      const { get } = createTestStore();
      get().setDuration(100);
      get().setCurrentTime(50);
      get().skipForward();
      expect(get().currentTime).toBe(60);
    });

    it('should skip forward by specified amount', () => {
      const { get } = createTestStore();
      get().setDuration(100);
      get().setCurrentTime(50);
      get().skipForward(5);
      expect(get().currentTime).toBe(55);
    });

    it('should not skip past duration', () => {
      const { get } = createTestStore();
      get().setDuration(100);
      get().setCurrentTime(95);
      get().skipForward(10);
      expect(get().currentTime).toBe(100);
    });

    it('should skip backward by default 10 seconds', () => {
      const { get } = createTestStore();
      get().setCurrentTime(50);
      get().skipBackward();
      expect(get().currentTime).toBe(40);
    });

    it('should skip backward by specified amount', () => {
      const { get } = createTestStore();
      get().setCurrentTime(50);
      get().skipBackward(5);
      expect(get().currentTime).toBe(45);
    });

    it('should not skip before 0', () => {
      const { get } = createTestStore();
      get().setCurrentTime(5);
      get().skipBackward(10);
      expect(get().currentTime).toBe(0);
    });
  });

  describe('stop', () => {
    it('should stop playback and reset time', () => {
      const { get } = createTestStore();
      get().play();
      get().setCurrentTime(50);
      get().stop();
      
      expect(get().isPlaying).toBe(false);
      expect(get().currentTime).toBe(0);
    });
  });

  describe('playback rate', () => {
    it('should set playback rate', () => {
      const { get } = createTestStore();
      get().setPlaybackRate(1.5);
      expect(get().playbackRate).toBe(1.5);
    });

    it('should clamp playback rate to valid range', () => {
      const { get } = createTestStore();
      get().setPlaybackRate(0.1);
      expect(get().playbackRate).toBe(0.25);
      
      get().setPlaybackRate(5);
      expect(get().playbackRate).toBe(4);
    });
  });

  describe('selectors', () => {
    it('selectPlaybackStatus should return playback state', () => {
      const state = {
        isPlaying: true,
        currentTime: 30,
        duration: 180,
      } as any;
      
      expect(selectPlaybackStatus(state)).toEqual({
        isPlaying: true,
        currentTime: 30,
        duration: 180,
      });
    });

    it('selectLoopState should return loop state', () => {
      const state = {
        loopMode: 'one' as LoopMode,
        loopRegion: { start: 10, end: 30 },
      } as any;
      
      expect(selectLoopState(state)).toEqual({
        loopMode: 'one',
        loopRegion: { start: 10, end: 30 },
      });
    });

    it('selectProgress should calculate progress percentage', () => {
      expect(selectProgress({ currentTime: 50, duration: 100 } as any)).toBe(0.5);
      expect(selectProgress({ currentTime: 0, duration: 0 } as any)).toBe(0);
      expect(selectProgress({ currentTime: 30, duration: 60 } as any)).toBe(0.5);
    });
  });
});
