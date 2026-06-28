# FSM State Schema — MusicVerse AI

**Documented**: 2026-06-29 (Sprint 037-11)
**Source**: `src/lib/stateMachine.ts`

## Overview

MusicVerse uses a lightweight TypeScript state machine (`createMachine`) instead of XState for bundle size optimization. The core library at `src/lib/stateMachine.ts` provides:

- Type-safe discriminated union states
- `entry`/`exit` lifecycle hooks
- Context payload propagation
- Subscriber pattern for state change notification
- Reset capability

## Core Library

### `createMachine<TState, TContext, TEvent>(config)`

**File**: `src/lib/stateMachine.ts`

```typescript
interface StateConfig<TState extends string, TContext> {
  initial: TState;
  context: TContext;
  states: {
    [K in TState]: {
      on?: Partial<Record<string, TState>>;
      entry?: (context: TContext) => void;
      exit?: (context: TContext) => void;
    };
  };
}
```

**Returned machine**:

| Method                  | Description                   |
| ----------------------- | ----------------------------- |
| `state`                 | Current state (getter)        |
| `context`               | Current context (getter)      |
| `send(event, payload?)` | Triggers transition           |
| `can(event)`            | Checks if transition is valid |
| `subscribe(fn)`         | Subscribes to state changes   |
| `getSnapshot()`         | Returns `{ state, context }`  |
| `reset()`               | Returns to initial state      |

### `useStateMachine(config)` — React Hook

- Calls `createMachine(config)` internally
- Uses `useMemo` for stable machine reference
- Notifies React on state changes via `subscribe`

## State Machines in Use

### 1. Modal State Machine — `useStudioModals`

**File**: `src/hooks/studio/useStudioModals.ts`
**States**: `idle | export | share | settings | ...` (10+ modals)
**Purpose**: Replaces 10+ individual `useState` calls with a single modal state

### 2. Player State Machine — `playerStore`

**File**: `src/stores/playerStore.ts` (Zustand)
**States**: `idle | loading | playing | paused | error`
**Events**: `PLAY | PAUSE | NEXT | PREVIOUS | SEEK | ERROR | LOAD`

### 3. Generation Flow — `useUnifiedStudioStore`

**File**: `src/stores/unifiedStudioStore.ts` (Zustand, 38KB)
**States**: `idle | configuring | generating | processing | complete | error`
**Events**: `START_GENERATION | CANCEL | RETRY | RESET`

### 4. Audio Context — `audioContextManager`

**File**: `src/lib/audioContextManager.ts`
**States**: `uninitialized | suspended | running | closed | error`
**Events**: `RESUME | SUSPEND | CLOSE | ERROR`

## Transition Rules

All machines enforce:

1. **Valid transitions only** — invalid events are logged (warning) and ignored
2. **Entry/Exit hooks** — side effects run on state entry/exit
3. **Context propagation** — payload merges into existing context
4. **Notification** — all subscribers get `(state, context)` on every transition

## Adding a New State Machine

```typescript
// 1. Define state and event types
type MyStates = "idle" | "loading" | "success" | "error";
type MyEvents = "FETCH" | "RESOLVE" | "REJECT" | "RETRY";

// 2. Create machine config
const machineConfig = {
  initial: "idle" as MyStates,
  context: { data: null, error: null },
  states: {
    idle: { on: { FETCH: "loading" } },
    loading: { on: { RESOLVE: "success", REJECT: "error" }, entry: (ctx) => logger.info("Loading...") },
    success: { on: { RETRY: "loading" } },
    error: { on: { RETRY: "loading" } },
  },
};

// 3. Use in component or store
const machine = createMachine<MyStates, typeof machineConfig.context, MyEvents>(machineConfig);
machine.send("FETCH", { data: null });
```

## References

- `src/lib/stateMachine.ts` — Core implementation (358 lines)
- `src/hooks/studio/useStudioModals.ts` — Modal state machine usage
- `src/stores/playerStore.ts` — Player state via Zustand
- `ADR/ADR-005-State-Machine-Architecture.md` — Architecture decision record
