/**
 * Unit tests for usePlayerStore (player state store)
 *
 * Tests the higher-level player store: queue management, volume,
 * shuffle/repeat modes, player UI modes, and playerLogic.
 *
 * Note: playbackSlice (play/pause/seek/loop) is tested separately
 * in playbackSlice.test.ts.
 */

import { vi } from "vitest";

// Mock logger to avoid side effects
vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { clampPlayerVolume, usePlayerStore, playerLogic } from "@/hooks/audio/usePlayerState";
import type { Track } from "@/types/track";

// ---------- Helpers ----------

const makeTrack = (id: string, overrides: Partial<Track> = {}): Track =>
  ({
    id,
    title: `Track ${id}`,
    audio_url: `https://cdn.example.com/${id}.mp3`,
    is_liked: false,
    likes_count: 0,
    ...overrides,
  }) as Track;

const trackA = makeTrack("a");
const trackB = makeTrack("b");
const trackC = makeTrack("c");
const trackD = makeTrack("d");

/** Reset store to initial state before each test */
beforeEach(() => {
  usePlayerStore.setState({
    activeTrack: null,
    isPlaying: false,
    queue: [],
    currentIndex: 0,
    shuffle: false,
    repeat: "off",
    versionMode: "active",
    volume: 1.0,
    playerMode: "minimized",
    preservedTime: null,
  });
});

// ============================================================
// playerLogic (pure functions)
// ============================================================

describe("playerLogic", () => {
  // Helper: build a minimal set/get pair backed by a plain object
  const createMockStore = (initial: Record<string, unknown> = {}) => {
    let state: Record<string, unknown> = {
      activeTrack: null,
      isPlaying: false,
      queue: [],
      currentIndex: 0,
      shuffle: false,
      repeat: "off",
      ...initial,
    };
    const set = (partial: Record<string, unknown>) => {
      state = { ...state, ...partial };
    };
    const get = () => state as any;
    return { set, get };
  };

  describe("playTrack", () => {
    it("should resume same track when paused", () => {
      const { set, get } = createMockStore({ activeTrack: trackA, isPlaying: false });
      playerLogic.playTrack(set, get, trackA);
      expect(get().isPlaying).toBe(true);
      expect(get().activeTrack.id).toBe("a");
    });

    it("should switch to a different track", () => {
      const { set, get } = createMockStore({ activeTrack: trackA, isPlaying: true });
      playerLogic.playTrack(set, get, trackB);
      expect(get().activeTrack.id).toBe("b");
      expect(get().isPlaying).toBe(true);
    });

    it("should update currentIndex when track is in queue", () => {
      const { set, get } = createMockStore({
        activeTrack: trackA,
        isPlaying: true,
        queue: [trackA, trackB, trackC],
        currentIndex: 0,
      });
      playerLogic.playTrack(set, get, trackC);
      expect(get().currentIndex).toBe(2);
    });

    it("should resume activeTrack when called with no argument", () => {
      const { set, get } = createMockStore({ activeTrack: trackA, isPlaying: false });
      playerLogic.playTrack(set, get);
      expect(get().isPlaying).toBe(true);
    });

    it("should play first queue track when no activeTrack and no argument", () => {
      const { set, get } = createMockStore({ queue: [trackB, trackC] });
      playerLogic.playTrack(set, get);
      expect(get().activeTrack.id).toBe("b");
      expect(get().currentIndex).toBe(0);
    });

    it("should do nothing when no activeTrack, no argument, empty queue", () => {
      const { set, get } = createMockStore();
      playerLogic.playTrack(set, get);
      expect(get().activeTrack).toBeNull();
      expect(get().isPlaying).toBe(false);
    });
  });

  describe("nextTrack", () => {
    it("should advance to next track", () => {
      const { set, get } = createMockStore({
        queue: [trackA, trackB, trackC],
        currentIndex: 0,
      });
      playerLogic.nextTrack(set, get);
      expect(get().activeTrack.id).toBe("b");
      expect(get().currentIndex).toBe(1);
    });

    it("should wrap with repeat all", () => {
      const { set, get } = createMockStore({
        queue: [trackA, trackB],
        currentIndex: 1,
        repeat: "all",
      });
      playerLogic.nextTrack(set, get);
      expect(get().activeTrack.id).toBe("a");
      expect(get().currentIndex).toBe(0);
    });

    it("should stop at end without repeat", () => {
      const { set, get } = createMockStore({
        queue: [trackA, trackB],
        currentIndex: 1,
        repeat: "off",
      });
      playerLogic.nextTrack(set, get);
      // Should not change
      expect(get().currentIndex).toBe(1);
    });

    it("should do nothing on empty queue", () => {
      const { set, get } = createMockStore({ queue: [] });
      playerLogic.nextTrack(set, get);
      expect(get().activeTrack).toBeNull();
    });

    it("should pick random index in shuffle mode", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.99);
      const { set, get } = createMockStore({
        queue: [trackA, trackB, trackC],
        currentIndex: 0,
        shuffle: true,
      });
      playerLogic.nextTrack(set, get);
      // Math.floor(0.99 * 3) = 2
      expect(get().currentIndex).toBe(2);
      vi.restoreAllMocks();
    });
  });

  describe("previousTrack", () => {
    it("should go to previous track", () => {
      const { set, get } = createMockStore({
        queue: [trackA, trackB, trackC],
        currentIndex: 2,
      });
      playerLogic.previousTrack(set, get);
      expect(get().activeTrack.id).toBe("b");
      expect(get().currentIndex).toBe(1);
    });

    it("should wrap to end from index 0", () => {
      const { set, get } = createMockStore({
        queue: [trackA, trackB, trackC],
        currentIndex: 0,
      });
      playerLogic.previousTrack(set, get);
      expect(get().activeTrack.id).toBe("c");
      expect(get().currentIndex).toBe(2);
    });

    it("should do nothing on empty queue", () => {
      const { set, get } = createMockStore({ queue: [] });
      playerLogic.previousTrack(set, get);
      expect(get().activeTrack).toBeNull();
    });
  });
});

// ============================================================
// usePlayerStore (Zustand store actions)
// ============================================================

describe("usePlayerStore", () => {
  const act = () => usePlayerStore.getState();

  describe("initial state", () => {
    it("should have correct defaults", () => {
      const s = act();
      expect(s.activeTrack).toBeNull();
      expect(s.isPlaying).toBe(false);
      expect(s.queue).toEqual([]);
      expect(s.currentIndex).toBe(0);
      expect(s.shuffle).toBe(false);
      expect(s.repeat).toBe("off");
      expect(s.versionMode).toBe("active");
      expect(s.volume).toBe(1.0);
      expect(s.playerMode).toBe("minimized");
      expect(s.preservedTime).toBeNull();
    });
  });

  // ---------- Queue management ----------

  describe("addToQueue", () => {
    it("should append track to queue", () => {
      act().addToQueue(trackA);
      act().addToQueue(trackB);
      expect(act().queue).toEqual([trackA, trackB]);
    });
  });

  describe("playNext", () => {
    it("should start playback when queue is empty", () => {
      act().playNext(trackA);
      expect(act().queue).toEqual([trackA]);
      expect(act().isPlaying).toBe(true);
      expect(act().activeTrack?.id).toBe("a");
    });

    it("should insert after current index", () => {
      usePlayerStore.setState({ queue: [trackA, trackC], currentIndex: 0 });
      act().playNext(trackB);
      expect(act().queue.map((t) => t.id)).toEqual(["a", "b", "c"]);
    });
  });

  describe("removeFromQueue", () => {
    it("should remove track at index", () => {
      usePlayerStore.setState({ queue: [trackA, trackB, trackC], currentIndex: 1 });
      act().removeFromQueue(2);
      expect(act().queue.map((t) => t.id)).toEqual(["a", "b"]);
      expect(act().currentIndex).toBe(1);
    });

    it("should decrement currentIndex when removing before current", () => {
      usePlayerStore.setState({ queue: [trackA, trackB, trackC], currentIndex: 2 });
      act().removeFromQueue(0);
      expect(act().currentIndex).toBe(1);
    });

    it("should update activeTrack when removing current track", () => {
      usePlayerStore.setState({
        queue: [trackA, trackB, trackC],
        currentIndex: 1,
        activeTrack: trackB,
      });
      act().removeFromQueue(1);
      // Should switch to the track now at index 1 (trackC)
      expect(act().activeTrack?.id).toBe("c");
    });
  });

  describe("clearQueue", () => {
    it("should clear everything", () => {
      usePlayerStore.setState({
        queue: [trackA, trackB],
        currentIndex: 1,
        activeTrack: trackA,
        isPlaying: true,
      });
      act().clearQueue();
      expect(act().queue).toEqual([]);
      expect(act().currentIndex).toBe(0);
      expect(act().activeTrack).toBeNull();
      expect(act().isPlaying).toBe(false);
    });
  });

  describe("reorderQueue", () => {
    it("should move track from one position to another", () => {
      usePlayerStore.setState({ queue: [trackA, trackB, trackC], currentIndex: 0 });
      act().reorderQueue(0, 2);
      expect(act().queue.map((t) => t.id)).toEqual(["b", "c", "a"]);
      // Current track was moved: currentIndex follows
      expect(act().currentIndex).toBe(2);
    });

    it("should adjust currentIndex when moving track from before to after current", () => {
      usePlayerStore.setState({ queue: [trackA, trackB, trackC, trackD], currentIndex: 2 });
      act().reorderQueue(0, 3);
      // Track moved from before current (0) to after current (3) -> currentIndex decrements
      expect(act().currentIndex).toBe(1);
    });

    it("should adjust currentIndex when moving track from after to before current", () => {
      usePlayerStore.setState({ queue: [trackA, trackB, trackC, trackD], currentIndex: 1 });
      act().reorderQueue(3, 0);
      // Track moved from after current (3) to before current (0) -> currentIndex increments
      expect(act().currentIndex).toBe(2);
    });
  });

  // ---------- Volume ----------

  describe("setVolume", () => {
    it("should set volume", () => {
      act().setVolume(0.5);
      expect(act().volume).toBe(0.5);
    });

    it("should clamp volume to 0-1", () => {
      act().setVolume(-0.5);
      expect(act().volume).toBe(0);

      act().setVolume(2);
      expect(act().volume).toBe(1);
    });

    it("should sanitize non-finite volume", () => {
      act().setVolume(Number.NaN);
      expect(act().volume).toBe(1);

      expect(clampPlayerVolume(-0.227833)).toBe(0);
      expect(clampPlayerVolume(Number.POSITIVE_INFINITY)).toBe(1);
    });
  });

  // ---------- Shuffle / Repeat ----------

  describe("toggleShuffle", () => {
    it("should toggle shuffle on and off", () => {
      expect(act().shuffle).toBe(false);
      act().toggleShuffle();
      expect(act().shuffle).toBe(true);
      act().toggleShuffle();
      expect(act().shuffle).toBe(false);
    });
  });

  describe("toggleRepeat", () => {
    it("should cycle off -> all -> one -> off", () => {
      expect(act().repeat).toBe("off");
      act().toggleRepeat();
      expect(act().repeat).toBe("all");
      act().toggleRepeat();
      expect(act().repeat).toBe("one");
      act().toggleRepeat();
      expect(act().repeat).toBe("off");
    });
  });

  describe("toggleVersionMode", () => {
    it("should toggle between active and all", () => {
      expect(act().versionMode).toBe("active");
      act().toggleVersionMode();
      expect(act().versionMode).toBe("all");
      act().toggleVersionMode();
      expect(act().versionMode).toBe("active");
    });
  });

  // ---------- Player UI modes ----------

  describe("player mode controls", () => {
    it("should set player mode", () => {
      act().setPlayerMode("fullscreen");
      expect(act().playerMode).toBe("fullscreen");
    });

    it("expandPlayer should go to fullscreen", () => {
      act().expandPlayer();
      expect(act().playerMode).toBe("fullscreen");
    });

    it("minimizePlayer should go to compact", () => {
      usePlayerStore.setState({ playerMode: "fullscreen" });
      act().minimizePlayer();
      expect(act().playerMode).toBe("compact");
    });

    it("maximizePlayer should go to fullscreen", () => {
      act().maximizePlayer();
      expect(act().playerMode).toBe("fullscreen");
    });
  });

  // ---------- Time preservation ----------

  describe("time preservation", () => {
    it("should preserve and clear time", () => {
      act().preserveTime(42.5);
      expect(act().preservedTime).toBe(42.5);

      act().clearPreservedTime();
      expect(act().preservedTime).toBeNull();
    });
  });

  // ---------- pauseTrack / closePlayer ----------

  describe("pauseTrack", () => {
    it("should set isPlaying to false", () => {
      usePlayerStore.setState({ isPlaying: true });
      act().pauseTrack();
      expect(act().isPlaying).toBe(false);
    });
  });

  describe("closePlayer", () => {
    it("should clear track, stop playing, and minimize", () => {
      usePlayerStore.setState({
        activeTrack: trackA,
        isPlaying: true,
        playerMode: "fullscreen",
      });
      act().closePlayer();
      expect(act().activeTrack).toBeNull();
      expect(act().isPlaying).toBe(false);
      expect(act().playerMode).toBe("minimized");
    });
  });

  // ---------- playTrack validation ----------

  describe("playTrack", () => {
    it("should reject track without audio URL", () => {
      const noAudio = makeTrack("noaudio", {
        audio_url: undefined as any,
        streaming_url: undefined as any,
        local_audio_url: undefined as any,
      });
      act().playTrack(noAudio);
      expect(act().isPlaying).toBe(false);
      expect(act().activeTrack).toBeNull();
    });

    it("should auto-open compact player when minimized", () => {
      expect(act().playerMode).toBe("minimized");
      act().playTrack(trackA);
      expect(act().playerMode).toBe("compact");
      expect(act().isPlaying).toBe(true);
    });
  });
});
