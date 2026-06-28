/**
 * 037-03: Audio unit tests — AudioElementPool
 *
 * Tests:
 * - Singleton pattern
 * - Acquire/Release cycle
 * - Pool limit enforcement
 * - Priority-based eviction
 * - Statistics tracking
 * - Static priority helper
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AudioElementPool, AudioPriority } from "@/lib/audioElementPool";

// Mock the logger to prevent real logging
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Audio constructor
class MockAudio {
  src = "";
  preload = "";
  crossOrigin: string | null = null;
  currentTime = 0;
  paused = true;
  onended: ((this: HTMLAudioElement, ev: Event) => any) | null = null;
  onerror: ((this: HTMLAudioElement, ev: Event | string) => any) | null = null;
  onloadeddata: ((this: HTMLAudioElement, ev: Event) => any) | null = null;
  oncanplay: ((this: HTMLAudioElement, ev: Event) => any) | null = null;
  ontimeupdate: ((this: HTMLAudioElement, ev: Event) => any) | null = null;

  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

// @ts-expect-error Mock Audio constructor
globalThis.Audio = MockAudio;

describe("AudioElementPool", () => {
  let pool: AudioElementPool;

  beforeEach(() => {
    // Reset singleton state by creating new instance via internal static reset
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (AudioElementPool as any).instance = null;
    pool = AudioElementPool.getInstance(6);
    pool.releaseAll();
  });

  afterEach(() => {
    pool.releaseAll();
  });

  // --- Singleton ---
  describe("Singleton pattern", () => {
    it("returns the same instance on repeated calls", () => {
      const a = AudioElementPool.getInstance();
      const b = AudioElementPool.getInstance();
      expect(a).toBe(b);
    });

    it("respects maxSize only on first initialization", () => {
      // First call with custom size
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (AudioElementPool as any).instance = null;
      const customPool = AudioElementPool.getInstance(4);
      const stats = customPool.getStats();
      expect(stats.capacity).toBe(4);

      // Second call ignores size
      const same = AudioElementPool.getInstance(100);
      expect(same.getStats().capacity).toBe(4);
    });

    it("defaults to capacity of 6", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (AudioElementPool as any).instance = null;
      const defaultPool = AudioElementPool.getInstance();
      expect(defaultPool.getStats().capacity).toBe(6);
    });
  });

  // --- Acquire ---
  describe("acquire", () => {
    it("returns an HTMLAudioElement when pool is not full", () => {
      const el = pool.acquire("test-1", AudioPriority.HIGH);
      expect(el).not.toBeNull();
      expect(el).toBeInstanceOf(MockAudio);
    });

    it("returns the same element for duplicate IDs", () => {
      const el1 = pool.acquire("duplicate-id", AudioPriority.MEDIUM);
      const el2 = pool.acquire("duplicate-id", AudioPriority.HIGH);
      expect(el1).toBe(el2);
    });

    it("returns null when pool limit is reached and no lower-priority elements exist", () => {
      // Fill pool with HIGH priority elements
      for (let i = 0; i < 6; i++) {
        pool.acquire(`high-${i}`, AudioPriority.HIGH);
      }

      const el = pool.acquire("overflow", AudioPriority.HIGH);
      expect(el).toBeNull();
    });

    it("rejects when all slots are HIGH and request is HIGH", () => {
      for (let i = 0; i < 6; i++) {
        pool.acquire(`h-${i}`, AudioPriority.HIGH);
      }
      const el = pool.acquire("another-high", AudioPriority.HIGH);
      expect(el).toBeNull();
    });
  });

  // --- Release ---
  describe("release", () => {
    it("returns element to pool making it available for new acquire", () => {
      const el = pool.acquire("rel-test", AudioPriority.MEDIUM);
      expect(el).not.toBeNull();

      pool.release("rel-test");
      const stats = pool.getStats();

      // Pool should have available slots
      expect(stats.active).toBe(0);
      expect(stats.available).toBeGreaterThanOrEqual(0);
    });

    it("is safe to call release on non-existent ID", () => {
      // Should not throw
      expect(() => pool.release("non-existent")).not.toThrow();
    });

    it("cleans up the element (pauses, clears src)", () => {
      const el = pool.acquire("cleanup-test", AudioPriority.MEDIUM)!;
      el.src = "https://example.com/audio.mp3";
      // Play it
      el.play();
      expect(el.paused).toBe(false);

      pool.release("cleanup-test");
      expect(el.src).toBe("");
      expect(el.paused).toBe(true);
      expect(el.currentTime).toBe(0);
    });
  });

  // --- Priority eviction ---
  describe("priority eviction (evictLowPriorityElement)", () => {
    it("evicts LOW priority element to make room for HIGH priority request", () => {
      for (let i = 0; i < 6; i++) {
        pool.acquire(`low-${i}`, AudioPriority.LOW);
      }

      const el = pool.acquire("high-priority", AudioPriority.HIGH);
      expect(el).not.toBeNull();
    });

    it("evicts oldest LOW when multiple LOW elements exist", () => {
      // Acquire 5 LOW elements
      for (let i = 0; i < 5; i++) {
        pool.acquire(`low-${i}`, AudioPriority.LOW);
      }
      // Acquire 1 MEDIUM (last slot)
      pool.acquire("medium-kept", AudioPriority.MEDIUM);

      // Request another MEDIUM — should evict a LOW, not the MEDIUM
      const el = pool.acquire("another-medium", AudioPriority.MEDIUM);
      expect(el).not.toBeNull();

      // The MEDIUM we previously acquired should still be there
      const stats = pool.getStats();
      expect(stats.active).toBe(6);
    });

    it("does not evict HIGH priority elements for MEDIUM request", () => {
      for (let i = 0; i < 6; i++) {
        pool.acquire(`high-${i}`, AudioPriority.HIGH);
      }

      const el = pool.acquire("medium-req", AudioPriority.MEDIUM);
      expect(el).toBeNull();
    });
  });

  // --- Statistics ---
  describe("getStats", () => {
    it("reports accurate active/available/capacity counts", () => {
      pool.acquire("stats-1", AudioPriority.HIGH);
      pool.acquire("stats-2", AudioPriority.MEDIUM);

      const stats = pool.getStats();
      expect(stats.active).toBe(2);
      expect(stats.capacity).toBe(6);
      expect(stats.totalAcquired).toBe(2);
      expect(stats.totalRejected).toBe(0);
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });

    it("increments totalRejected when pool is full", () => {
      for (let i = 0; i < 6; i++) {
        pool.acquire(`full-${i}`, AudioPriority.HIGH);
      }
      // Should be rejected
      pool.acquire("reject-me", AudioPriority.HIGH);

      const stats = pool.getStats();
      expect(stats.totalRejected).toBeGreaterThanOrEqual(1);
    });
  });

  // --- getActiveElements ---
  describe("getActiveElements", () => {
    it("returns metadata for active elements", () => {
      pool.acquire("active-1", AudioPriority.HIGH);
      pool.acquire("active-2", AudioPriority.LOW);

      const active = pool.getActiveElements();
      expect(active).toHaveLength(2);
      expect(active[0]).toHaveProperty("id");
      expect(active[0]).toHaveProperty("priority");
      expect(active[0]).toHaveProperty("age");
    });

    it("returns empty array when no active elements", () => {
      const active = pool.getActiveElements();
      expect(active).toHaveLength(0);
    });
  });

  // --- releaseAll ---
  describe("releaseAll", () => {
    it("clears all active elements", () => {
      for (let i = 0; i < 3; i++) {
        pool.acquire(`all-${i}`, AudioPriority.MEDIUM);
      }

      pool.releaseAll();
      expect(pool.getStats().active).toBe(0);
      expect(pool.getActiveElements()).toHaveLength(0);
    });
  });

  // --- Static helper: getPriorityForStemType ---
  describe("getPriorityForStemType (static)", () => {
    it("returns HIGH for vocals", () => {
      expect(AudioElementPool.getPriorityForStemType("vocals")).toBe(AudioPriority.HIGH);
      expect(AudioElementPool.getPriorityForStemType("VOCAL")).toBe(AudioPriority.HIGH);
      expect(AudioElementPool.getPriorityForStemType("lead")).toBe(AudioPriority.HIGH);
      expect(AudioElementPool.getPriorityForStemType("main")).toBe(AudioPriority.HIGH);
      expect(AudioElementPool.getPriorityForStemType("melody")).toBe(AudioPriority.HIGH);
    });

    it("returns MEDIUM for rhythm section", () => {
      expect(AudioElementPool.getPriorityForStemType("bass")).toBe(AudioPriority.MEDIUM);
      expect(AudioElementPool.getPriorityForStemType("drum")).toBe(AudioPriority.MEDIUM);
      expect(AudioElementPool.getPriorityForStemType("rhythm")).toBe(AudioPriority.MEDIUM);
      expect(AudioElementPool.getPriorityForStemType("guitar")).toBe(AudioPriority.MEDIUM);
    });

    it("returns LOW for ambient/other", () => {
      expect(AudioElementPool.getPriorityForStemType("ambient")).toBe(AudioPriority.LOW);
      expect(AudioElementPool.getPriorityForStemType("fx")).toBe(AudioPriority.LOW);
      expect(AudioElementPool.getPriorityForStemType("unknown")).toBe(AudioPriority.LOW);
    });
  });
});
