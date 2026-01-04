/**
 * Lightweight TypeScript State Machine using Discriminated Unions
 * Phase 4: IMP027 - Type-safe state transitions without XState dependency
 */

/**
 * State configuration for a state machine
 */
export interface StateConfig<TState extends string, TContext> {
  /** Initial state */
  initial: TState;
  /** Initial context */
  context: TContext;
  /** State definitions with allowed transitions */
  states: {
    [K in TState]: {
      /** States that can be transitioned to from this state */
      on?: Partial<Record<string, TState>>;
      /** Entry action when entering this state */
      entry?: (context: TContext) => void;
      /** Exit action when leaving this state */
      exit?: (context: TContext) => void;
    };
  };
}

/**
 * State machine instance
 */
export interface StateMachine<TState extends string, TContext, TEvent extends string> {
  /** Current state */
  state: TState;
  /** Current context */
  context: TContext;
  /** Send an event to trigger a transition */
  send: (event: TEvent, payload?: Partial<TContext>) => void;
  /** Check if a transition is valid */
  can: (event: TEvent) => boolean;
  /** Subscribe to state changes */
  subscribe: (listener: (state: TState, context: TContext) => void) => () => void;
  /** Get current snapshot */
  getSnapshot: () => { state: TState; context: TContext };
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Create a type-safe state machine
 */
export function createMachine<
  TState extends string,
  TContext,
  TEvent extends string
>(
  config: StateConfig<TState, TContext>
): StateMachine<TState, TContext, TEvent> {
  let currentState = config.initial;
  let currentContext = { ...config.context };
  const listeners: Set<(state: TState, context: TContext) => void> = new Set();

  const notifyListeners = () => {
    listeners.forEach(listener => listener(currentState, currentContext));
  };

  const getStateConfig = (state: TState) => config.states[state];

  return {
    get state() {
      return currentState;
    },
    get context() {
      return currentContext;
    },
    
    send(event: TEvent, payload?: Partial<TContext>) {
      const stateConfig = getStateConfig(currentState);
      const nextState = stateConfig.on?.[event] as TState | undefined;

      if (!nextState) {
        console.warn(`Invalid transition: ${currentState} + ${event}`);
        return;
      }

      // Exit current state
      stateConfig.exit?.(currentContext);

      // Update context if payload provided
      if (payload) {
        currentContext = { ...currentContext, ...payload };
      }

      // Transition to next state
      const previousState = currentState;
      currentState = nextState;

      // Enter new state
      const nextStateConfig = getStateConfig(nextState);
      nextStateConfig.entry?.(currentContext);

      // Notify listeners
      notifyListeners();

      // Debug log in development
      if (import.meta.env.DEV) {
        console.debug(`[StateMachine] ${previousState} -> ${nextState} (${event})`);
      }
    },

    can(event: TEvent): boolean {
      const stateConfig = getStateConfig(currentState);
      return event in (stateConfig.on || {});
    },

    subscribe(listener: (state: TState, context: TContext) => void) {
      listeners.add(listener);
      // Immediately call with current state
      listener(currentState, currentContext);
      return () => listeners.delete(listener);
    },

    getSnapshot() {
      return { state: currentState, context: { ...currentContext } };
    },

    reset() {
      const stateConfig = getStateConfig(currentState);
      stateConfig.exit?.(currentContext);

      currentState = config.initial;
      currentContext = { ...config.context };

      const initialStateConfig = getStateConfig(config.initial);
      initialStateConfig.entry?.(currentContext);

      notifyListeners();
    },
  };
}

/**
 * React hook for using state machine
 */
import { useState, useEffect, useCallback, useMemo } from 'react';

export function useStateMachine<
  TState extends string,
  TContext,
  TEvent extends string
>(config: StateConfig<TState, TContext>) {
  const machine = useMemo(() => createMachine<TState, TContext, TEvent>(config), []);
  
  const [snapshot, setSnapshot] = useState(() => machine.getSnapshot());

  useEffect(() => {
    const unsubscribe = machine.subscribe((state, context) => {
      setSnapshot({ state, context });
    });
    return unsubscribe;
  }, [machine]);

  const send = useCallback((event: TEvent, payload?: Partial<TContext>) => {
    machine.send(event, payload);
  }, [machine]);

  const can = useCallback((event: TEvent) => {
    return machine.can(event);
  }, [machine]);

  const reset = useCallback(() => {
    machine.reset();
  }, [machine]);

  return {
    state: snapshot.state,
    context: snapshot.context,
    send,
    can,
    reset,
  };
}

// ============================================================================
// Lyrics Wizard State Machine Definition (IMP027)
// ============================================================================

export type LyricsWizardState = 
  | 'concept'      // Step 1: Define theme, genre, mood
  | 'structure'    // Step 2: Choose song structure
  | 'writing'      // Step 3: Write/generate lyrics
  | 'enrichment'   // Step 4: Add vocal/instrument tags
  | 'validation';  // Step 5: Final validation

export type LyricsWizardEvent =
  | 'NEXT'
  | 'BACK'
  | 'RESET'
  | 'JUMP_TO_CONCEPT'
  | 'JUMP_TO_STRUCTURE'
  | 'JUMP_TO_WRITING'
  | 'JUMP_TO_ENRICHMENT'
  | 'JUMP_TO_VALIDATION';

export interface LyricsWizardContext {
  hasValidConcept: boolean;
  hasValidStructure: boolean;
  hasValidLyrics: boolean;
  hasEnrichment: boolean;
  isComplete: boolean;
}

export const lyricsWizardMachineConfig: StateConfig<
  LyricsWizardState,
  LyricsWizardContext
> = {
  initial: 'concept',
  context: {
    hasValidConcept: false,
    hasValidStructure: false,
    hasValidLyrics: false,
    hasEnrichment: false,
    isComplete: false,
  },
  states: {
    concept: {
      on: {
        NEXT: 'structure',
        JUMP_TO_STRUCTURE: 'structure',
      },
    },
    structure: {
      on: {
        NEXT: 'writing',
        BACK: 'concept',
        JUMP_TO_CONCEPT: 'concept',
        JUMP_TO_WRITING: 'writing',
      },
    },
    writing: {
      on: {
        NEXT: 'enrichment',
        BACK: 'structure',
        JUMP_TO_CONCEPT: 'concept',
        JUMP_TO_STRUCTURE: 'structure',
        JUMP_TO_ENRICHMENT: 'enrichment',
      },
    },
    enrichment: {
      on: {
        NEXT: 'validation',
        BACK: 'writing',
        JUMP_TO_CONCEPT: 'concept',
        JUMP_TO_STRUCTURE: 'structure',
        JUMP_TO_WRITING: 'writing',
        JUMP_TO_VALIDATION: 'validation',
      },
    },
    validation: {
      on: {
        BACK: 'enrichment',
        RESET: 'concept',
        JUMP_TO_CONCEPT: 'concept',
        JUMP_TO_STRUCTURE: 'structure',
        JUMP_TO_WRITING: 'writing',
        JUMP_TO_ENRICHMENT: 'enrichment',
      },
    },
  },
};

// ============================================================================
// Generation State Machine Definition
// ============================================================================

export type GenerationState =
  | 'idle'
  | 'preparing'
  | 'validating'
  | 'generating'
  | 'processing'
  | 'success'
  | 'error';

export type GenerationEvent =
  | 'START'
  | 'VALIDATE'
  | 'VALIDATION_PASS'
  | 'VALIDATION_FAIL'
  | 'GENERATE'
  | 'PROGRESS'
  | 'COMPLETE'
  | 'ERROR'
  | 'RETRY'
  | 'RESET';

export interface GenerationContext {
  progress: number;
  errorMessage?: string;
  taskId?: string;
  retryCount: number;
  maxRetries: number;
}

export const generationMachineConfig: StateConfig<
  GenerationState,
  GenerationContext
> = {
  initial: 'idle',
  context: {
    progress: 0,
    retryCount: 0,
    maxRetries: 3,
  },
  states: {
    idle: {
      on: {
        START: 'preparing',
      },
      entry: (ctx) => {
        ctx.progress = 0;
        ctx.errorMessage = undefined;
        ctx.taskId = undefined;
      },
    },
    preparing: {
      on: {
        VALIDATE: 'validating',
        ERROR: 'error',
        RESET: 'idle',
      },
    },
    validating: {
      on: {
        VALIDATION_PASS: 'generating',
        VALIDATION_FAIL: 'error',
        RESET: 'idle',
      },
    },
    generating: {
      on: {
        PROGRESS: 'generating',
        COMPLETE: 'processing',
        ERROR: 'error',
        RESET: 'idle',
      },
    },
    processing: {
      on: {
        COMPLETE: 'success',
        ERROR: 'error',
        RESET: 'idle',
      },
    },
    success: {
      on: {
        RESET: 'idle',
        START: 'preparing',
      },
    },
    error: {
      on: {
        RETRY: 'preparing',
        RESET: 'idle',
      },
      entry: (ctx) => {
        ctx.retryCount++;
      },
    },
  },
};
