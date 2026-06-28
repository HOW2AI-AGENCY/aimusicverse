export type TrackID = string;

export interface PlaybackQueue {
  version: 1;
  queue: TrackID[];
  currentIndex: number;
  timestamp: number;
}

export interface QueueOperations {
  addToQueue(trackId: TrackID): void;
  playNext(trackId: TrackID): void;
  removeFromQueue(index: number): void;
  reorderQueue(fromIndex: number, toIndex: number): void;
  clearQueue(): void;
  setCurrentIndex(index: number): void;
}
