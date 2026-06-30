import { describe, it, expect, beforeEach } from "vitest";
import { create } from "zustand";
import { withHistory } from "@/stores/middleware/withHistory";
import type { WithHistory } from "@/stores/middleware/withHistory";

// --------------- test store setup ---------------

interface CounterState {
  count: number;
  label: string;
  increment: () => void;
  decrement: () => void;
  setLabel: (l: string) => void;
  reset: () => void;
}

type CounterWithHistory = WithHistory<CounterState>;

function makeStore() {
  return create<CounterWithHistory>()(
    withHistory<CounterState>({ include: ["count", "label"], limit: 5 })((set) => ({
      count: 0,
      label: "initial",
      increment: () => set((s) => ({ count: s.count + 1 })),
      decrement: () => set((s) => ({ count: s.count - 1 })),
      setLabel: (label) => set({ label }),
      reset: () => set({ count: 0, label: "initial" }),
    })),
  );
}

let store: ReturnType<typeof makeStore>;

beforeEach(() => {
  store = makeStore();
});

// --------------- tests ---------------

describe("withHistory middleware", () => {
  it("starts with canUndo=false and canRedo=false", () => {
    const s = store.getState();
    expect(s.canUndo).toBe(false);
    expect(s.canRedo).toBe(false);
    expect(s._past).toHaveLength(0);
    expect(s._future).toHaveLength(0);
  });

  it("enables canUndo after a tracked field changes", () => {
    store.getState().increment();
    expect(store.getState().canUndo).toBe(true);
    expect(store.getState().count).toBe(1);
  });

  it("undo restores the previous snapshot", () => {
    store.getState().increment(); // count=1
    store.getState().increment(); // count=2
    store.getState().undo();
    expect(store.getState().count).toBe(1);
    expect(store.getState().canRedo).toBe(true);
  });

  it("redo re-applies undone change", () => {
    store.getState().increment(); // count=1
    store.getState().undo(); // count=0
    store.getState().redo(); // count=1
    expect(store.getState().count).toBe(1);
    expect(store.getState().canRedo).toBe(false);
  });

  it("new change after undo clears redo stack", () => {
    store.getState().increment(); // count=1
    store.getState().undo(); // count=0
    store.getState().increment(); // count=1 — new branch
    expect(store.getState().canRedo).toBe(false);
    expect(store.getState()._future).toHaveLength(0);
  });

  it("respects the history limit", () => {
    for (let i = 0; i < 10; i++) store.getState().increment();
    // limit=5 → at most 5 past entries
    expect(store.getState()._past.length).toBeLessThanOrEqual(5);
  });

  it("clearHistory resets past and future but keeps current state", () => {
    store.getState().increment();
    store.getState().increment();
    store.getState().clearHistory();
    expect(store.getState().canUndo).toBe(false);
    expect(store.getState().canRedo).toBe(false);
    expect(store.getState().count).toBe(2); // state preserved
  });

  it("tracks multiple included fields independently", () => {
    store.getState().setLabel("hello");
    store.getState().increment();
    store.getState().undo(); // revert count
    expect(store.getState().count).toBe(0);
    expect(store.getState().label).toBe("hello"); // label unaffected by this undo
    store.getState().undo(); // revert label
    expect(store.getState().label).toBe("initial");
  });

  it("undo/redo are no-ops when history is empty", () => {
    expect(() => {
      store.getState().undo();
      store.getState().redo();
    }).not.toThrow();
    expect(store.getState().count).toBe(0);
  });
});
