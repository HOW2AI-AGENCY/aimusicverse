/**
 * withHistory — generic Zustand middleware for undo/redo.
 *
 * Usage:
 *   const useMyStore = create<MyState & HistoryControls>()(
 *     withHistory({ include: ['field1', 'field2'], limit: 50 })(
 *       (set) => ({ field1: '', field2: 0, setField1: (v) => set({ field1: v }) })
 *     )
 *   );
 *
 *   const { undo, redo, canUndo, canRedo } = useMyStore();
 */

import type { StateCreator, StoreApi } from "zustand";

// Public interface consumers see
export interface HistoryControls {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

// Internal fields stored alongside user state (underscore prefix = private)
export interface HistoryInternals<T> {
  _past: Partial<T>[];
  _future: Partial<T>[];
}

export type WithHistory<T> = T & HistoryControls & HistoryInternals<T>;

export interface WithHistoryConfig<T extends object> {
  /** Fields to snapshot. Only these fields participate in undo/redo. */
  include: (keyof T)[];
  /** Maximum snapshots retained. Default: 50. */
  limit?: number;
}

/** Deep-clone only the tracked fields from state. */
function pickSnap<T extends object>(state: T, keys: (keyof T)[]): Partial<T> {
  const snap: Partial<T> = {};
  for (const k of keys) {
    const v = state[k];
    snap[k] = v === null || typeof v !== "object" ? v : (JSON.parse(JSON.stringify(v)) as T[typeof k]);
  }
  return snap;
}

/** True if any of the tracked fields changed between two snapshots. */
function hasChanged<T extends object>(a: Partial<T>, b: T, keys: (keyof T)[]): boolean {
  return keys.some((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
}

export function withHistory<T extends object>(config: WithHistoryConfig<T>) {
  const limit = config.limit ?? 50;
  const { include } = config;

  return (f: StateCreator<T, [], [], T>): StateCreator<WithHistory<T>, [], [], WithHistory<T>> => {
    return (
      set: (
        partial: Partial<WithHistory<T>> | ((s: WithHistory<T>) => Partial<WithHistory<T>>),
        replace?: boolean,
      ) => void,
      get: () => WithHistory<T>,
      api: StoreApi<WithHistory<T>>,
    ): WithHistory<T> => {
      // Flag prevents history ops from re-triggering themselves
      let isHistoryOp = false;

      // Wrap set: before applying, snapshot tracked fields; after applying, push to history
      const trackedSet = (partial: Partial<T> | ((s: T) => Partial<T>), replace?: boolean) => {
        if (isHistoryOp) {
          set(partial as Partial<WithHistory<T>>, replace);
          return;
        }

        const before = pickSnap(get() as T, include);
        set(partial as Partial<WithHistory<T>>, replace);

        if (hasChanged(before, get() as T, include)) {
          const newPast = [...get()._past, before].slice(-limit);
          isHistoryOp = true;
          set({ _past: newPast, _future: [], canUndo: newPast.length > 0, canRedo: false });
          isHistoryOp = false;
        }
      };

      // Initialise the user's store with the wrapped setter
      const base = f(
        trackedSet as StateCreator<T, [], [], T> extends (set: infer S, ...rest: infer R) => T ? S : never,
        get as () => T,
        api as unknown as StoreApi<T>,
      );

      return {
        ...base,

        // --- history internals ---
        _past: [],
        _future: [],

        // --- public controls ---
        canUndo: false,
        canRedo: false,

        undo() {
          const s = get();
          if (s._past.length === 0) return;
          const prev = s._past[s._past.length - 1];
          const curr = pickSnap(s as T, include);
          const newPast = s._past.slice(0, -1);
          isHistoryOp = true;
          set({
            ...prev,
            _past: newPast,
            _future: [curr, ...s._future],
            canUndo: newPast.length > 0,
            canRedo: true,
          });
          isHistoryOp = false;
        },

        redo() {
          const s = get();
          if (s._future.length === 0) return;
          const [next, ...newFuture] = s._future;
          const curr = pickSnap(s as T, include);
          isHistoryOp = true;
          set({
            ...next,
            _past: [...s._past, curr],
            _future: newFuture,
            canUndo: true,
            canRedo: newFuture.length > 0,
          });
          isHistoryOp = false;
        },

        clearHistory() {
          isHistoryOp = true;
          set({ _past: [], _future: [], canUndo: false, canRedo: false });
          isHistoryOp = false;
        },
      };
    };
  };
}
