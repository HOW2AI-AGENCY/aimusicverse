import type { PlaybackQueue, TrackID } from "@/types/queue";
import { PlaybackQueueSchema } from "@/lib/validation/queue-schema";

const STORAGE_KEY = "musicverse-queue";

export function loadQueue(): PlaybackQueue {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultQueue();
    const parsed = JSON.parse(raw);
    const result = PlaybackQueueSchema.safeParse(parsed);
    return result.success ? result.data : createDefaultQueue();
  } catch {
    return createDefaultQueue();
  }
}

export function saveQueue(queue: PlaybackQueue): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage full or unavailable
  }
}

export function clearQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}

function createDefaultQueue(): PlaybackQueue {
  return {
    version: 1,
    queue: [] as TrackID[],
    currentIndex: -1,
    timestamp: Date.now(),
  };
}
