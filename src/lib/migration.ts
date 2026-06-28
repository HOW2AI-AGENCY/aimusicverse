import type { PlaybackQueue } from "@/types/queue";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "migration" });
const QUEUE_STORAGE_KEY = "musicverse-queue";

export function migrateQueueFromPlayerStore(): void {
  try {
    const existingQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (existingQueue) return;

    const storeState = (window as unknown as Record<string, unknown>).__playerStore;
    if (!storeState || typeof storeState !== "object") {
      log.info("No player store found for queue migration");
      return;
    }

    const getState = (storeState as { getState?: () => { queue?: unknown[]; currentIndex?: number } }).getState;
    if (typeof getState !== "function") return;

    const state = getState();
    const queue = state?.queue;
    const currentIndex = state?.currentIndex;

    if (!Array.isArray(queue) || queue.length === 0) {
      log.info("No queue data to migrate");
      return;
    }

    const trackIds = queue
      .map((t: unknown) => (t && typeof t === "object" ? (t as Record<string, unknown>).id : null))
      .filter(Boolean) as string[];

    if (trackIds.length === 0) return;

    const queueData: PlaybackQueue = {
      version: 1,
      queue: trackIds,
      currentIndex: typeof currentIndex === "number" ? currentIndex : -1,
      timestamp: Date.now(),
    };

    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queueData));
    log.info(`Migrated ${trackIds.length} tracks from playerStore to localStorage`);
  } catch (err) {
    log.error("Queue migration failed", err);
  }
}
