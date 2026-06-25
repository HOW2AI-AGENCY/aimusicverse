/**
 * GestureManager Class
 *
 * Advanced gesture management system for coordinating multiple gesture recognizers.
 * Handles gesture conflicts, priority, and composition.
 *
 * @feature Spec 001 - Phase 2: Foundational Components
 * @priority P1 - Mobile Optimization
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type GestureType =
  | 'tap'
  | 'doubleTap'
  | 'longPress'
  | 'swipeLeft'
  | 'swipeRight'
  | 'swipeUp'
  | 'swipeDown'
  | 'pinch'
  | 'rotate'
  | 'pan'
  | 'scroll';

export interface GestureConfig {
  type: GestureType;
  priority: number;
  exclusive: boolean;
  handler: (data: any) => void;
}

export interface GestureData {
  type: GestureType;
  distance?: number;
  velocity?: number;
  scale?: number;
  angle?: number;
  center?: { x: number; y: number };
  timestamp: number;
}

// ============================================================================
// GESTURE MANAGER CLASS
// ============================================================================

export class GestureManager {
  private recognizers: Map<string, GestureConfig> = new Map();
  private activeGestures: Set<string> = new Set();
  private pendingGestures: Map<string, GestureData> = new Map();
  private defaultPriority = 10;

  /**
   * Register a gesture recognizer
   */
  register(id: string, config: GestureConfig): void {
    this.recognizers.set(id, config);
  }

  /**
   * Unregister a gesture recognizer
   */
  unregister(id: string): void {
    this.recognizers.delete(id);
    this.activeGestures.delete(id);
    this.pendingGestures.delete(id);
  }

  /**
   * Get a gesture recognizer by ID
   */
  getRecognizer(id: string): GestureConfig | undefined {
    return this.recognizers.get(id);
  }

  /**
   * Start tracking a gesture
   */
  startGesture(id: string, data: GestureData): boolean {
    const recognizer = this.recognizers.get(id);
    if (!recognizer) return false;

    // Check if an exclusive gesture is already active
    if (this.activeGestures.size > 0) {
      const activeId = Array.from(this.activeGestures)[0];
      const activeRecognizer = this.recognizers.get(activeId);

      if (activeRecognizer?.exclusive) {
        return false; // Cannot start new gesture
      }

      // Check priority
      if (recognizer.priority < activeRecognizer?.priority!) {
        return false;
      }

      // Cancel lower priority gesture
      this.cancelGesture(activeId);
    }

    this.pendingGestures.set(id, data);
    return true;
  }

  /**
   * Confirm a gesture (transition from pending to active)
   */
  confirmGesture(id: string, data?: GestureData): void {
    if (!this.pendingGestures.has(id)) return;

    const recognizer = this.recognizers.get(id);
    if (!recognizer) return;

    // Cancel exclusive gestures with lower priority
    if (recognizer.exclusive) {
      for (const activeId of this.activeGestures) {
        const activeRecognizer = this.recognizers.get(activeId);
        if (activeRecognizer?.priority! < recognizer.priority) {
          this.cancelGesture(activeId);
        }
      }
    }

    this.pendingGestures.delete(id);
    this.activeGestures.add(id);

    if (data) {
      recognizer.handler(data);
    }
  }

  /**
   * Cancel a gesture
   */
  cancelGesture(id: string): void {
    this.activeGestures.delete(id);
    this.pendingGestures.delete(id);
  }

  /**
   * Update gesture data
   */
  updateGesture(id: string, data: Partial<GestureData>): void {
    const currentData = this.pendingGestures.get(id) || this.activeGestures.has(id);
    if (!currentData && !this.activeGestures.has(id)) return;

    const recognizer = this.recognizers.get(id);
    if (!recognizer) return;

    const updatedData: GestureData = {
      type: recognizer.type,
      timestamp: Date.now(),
      ...data,
    };

    if (this.activeGestures.has(id)) {
      recognizer.handler(updatedData);
    } else {
      this.pendingGestures.set(id, updatedData);
    }
  }

  /**
   * End a gesture
   */
  endGesture(id: string, data?: GestureData): void {
    if (!this.activeGestures.has(id)) return;

    const recognizer = this.recognizers.get(id);
    if (!recognizer) return;

    if (data) {
      recognizer.handler(data);
    }

    this.activeGestures.delete(id);
  }

  /**
   * Check if a gesture is active
   */
  isGestureActive(id: string): boolean {
    return this.activeGestures.has(id);
  }

  /**
   * Check if a gesture is pending
   */
  isGesturePending(id: string): boolean {
    return this.pendingGestures.has(id);
  }

  /**
   * Get all active gestures
   */
  getActiveGestures(): string[] {
    return Array.from(this.activeGestures);
  }

  /**
   * Get all pending gestures
   */
  getPendingGestures(): string[] {
    return Array.from(this.pendingGestures.keys());
  }

  /**
   * Cancel all gestures
   */
  cancelAllGestures(): void {
    this.activeGestures.clear();
    this.pendingGestures.clear();
  }

  /**
   * Set default priority for new gestures
   */
  setDefaultPriority(priority: number): void {
    this.defaultPriority = priority;
  }

  /**
   * Get gesture conflicts
   */
  getConflicts(id: string): string[] {
    const recognizer = this.recognizers.get(id);
    if (!recognizer) return [];

    const conflicts: string[] = [];

    for (const [otherId, otherRecognizer] of this.recognizers) {
      if (otherId === id) continue;

      // Check for type conflicts
      if (this.areGesturesConflicting(recognizer.type, otherRecognizer.type)) {
        conflicts.push(otherId);
      }
    }

    return conflicts;
  }

  /**
   * Check if two gesture types conflict
   */
  private areGesturesConflicting(type1: GestureType, type2: GestureType): boolean {
    const swipeGestures: GestureType[] = [
      'swipeLeft',
      'swipeRight',
      'swipeUp',
      'swipeDown',
    ];

    // Swipes conflict with each other
    if (
      swipeGestures.includes(type1) &&
      swipeGestures.includes(type2)
    ) {
      return true;
    }

    // Pinch and rotate conflict
    if (
      (type1 === 'pinch' && type2 === 'rotate') ||
      (type1 === 'rotate' && type2 === 'pinch')
    ) {
      return true;
    }

    // Pan and scroll conflict
    if ((type1 === 'pan' && type2 === 'scroll') || (type1 === 'scroll' && type2 === 'pan')) {
      return true;
    }

    return false;
  }

  /**
   * Resolve gesture priority conflicts
   */
  resolveConflict(id1: string, id2: string): string | null {
    const recognizer1 = this.recognizers.get(id1);
    const recognizer2 = this.recognizers.get(id2);

    if (!recognizer1 || !recognizer2) return null;

    // Higher priority wins
    if (recognizer1.priority > recognizer2.priority) {
      return id1;
    } else if (recognizer2.priority > recognizer1.priority) {
      return id2;
    }

    // If priorities are equal, exclusive wins
    if (recognizer1.exclusive && !recognizer2.exclusive) {
      return id1;
    } else if (recognizer2.exclusive && !recognizer1.exclusive) {
      return id2;
    }

    // If still equal, first registered wins
    const id1Index = Array.from(this.recognizers.keys()).indexOf(id1);
    const id2Index = Array.from(this.recognizers.keys()).indexOf(id2);

    return id1Index < id2Index ? id1 : id2;
  }

  /**
   * Get gesture statistics
   */
  getStats(): {
    totalRecognizers: number;
    activeGestures: number;
    pendingGestures: number;
    exclusiveGestures: number;
  } {
    let exclusiveCount = 0;
    for (const recognizer of this.recognizers.values()) {
      if (recognizer.exclusive) exclusiveCount++;
    }

    return {
      totalRecognizers: this.recognizers.size,
      activeGestures: this.activeGestures.size,
      pendingGestures: this.pendingGestures.size,
      exclusiveGestures: exclusiveCount,
    };
  }

  /**
   * Clear all recognizers (cleanup)
   */
  destroy(): void {
    this.cancelAllGestures();
    this.recognizers.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalGestureManager: GestureManager | null = null;

/**
 * Get the global gesture manager instance
 */
export function getGlobalGestureManager(): GestureManager {
  if (!globalGestureManager) {
    globalGestureManager = new GestureManager();
  }
  return globalGestureManager;
}

/**
 * Reset the global gesture manager (for testing)
 */
export function resetGlobalGestureManager(): void {
  if (globalGestureManager) {
    globalGestureManager.destroy();
    globalGestureManager = null;
  }
}
