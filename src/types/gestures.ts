export interface GestureSettings {
  doubleTapSeek: {
    enabled: boolean;
    seekAmount: number;
    leftSideEnabled: boolean;
    rightSideEnabled: boolean;
  };
  horizontalSwipe: {
    enabled: boolean;
    threshold: number;
    velocityThreshold: number;
  };
  hintOverlay: {
    shown: boolean;
    dismissed: boolean;
    lastShown?: number;
  };
  keyboard: {
    enabled: boolean;
    seekAmount: number;
  };
  version: 1;
  lastUpdated: number;
}

export const DEFAULT_GESTURE_SETTINGS: GestureSettings = {
  doubleTapSeek: { enabled: true, seekAmount: 10, leftSideEnabled: true, rightSideEnabled: true },
  horizontalSwipe: { enabled: true, threshold: 80, velocityThreshold: 400 },
  hintOverlay: { shown: false, dismissed: false },
  keyboard: { enabled: true, seekAmount: 10 },
  version: 1,
  lastUpdated: Date.now(),
};
