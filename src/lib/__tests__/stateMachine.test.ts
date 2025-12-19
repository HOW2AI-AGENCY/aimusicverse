/**
 * Unit tests for State Machine implementation
 */

import { renderHook, act } from '@testing-library/react';
import {
  useStateMachine,
  createMachine,
  type StateConfig,
} from '../stateMachine';

// Test machine configuration
type TestStates = 'idle' | 'loading' | 'success' | 'error';
type TestEvents = 'FETCH' | 'SUCCESS' | 'ERROR' | 'RESET';

interface TestContext {
  data: string | null;
  error: string | null;
  retryCount: number;
}

const createTestMachineConfig = (): StateConfig<TestStates, TestContext> => ({
  initial: 'idle',
  context: {
    data: null,
    error: null,
    retryCount: 0,
  },
  states: {
    idle: {
      on: {
        FETCH: 'loading',
      },
    },
    loading: {
      on: {
        SUCCESS: 'success',
        ERROR: 'error',
      },
      entry: (ctx: TestContext) => {
        ctx.error = null;
      },
    },
    success: {
      on: {
        RESET: 'idle',
        FETCH: 'loading',
      },
    },
    error: {
      on: {
        RESET: 'idle',
        FETCH: 'loading',
      },
      entry: (ctx: TestContext) => {
        ctx.retryCount = ctx.retryCount + 1;
      },
    },
  },
});

describe('createMachine', () => {
  it('should create machine with initial state', () => {
    const config = createTestMachineConfig();
    const machine = createMachine<TestStates, TestContext, TestEvents>(config);

    expect(machine.state).toBe('idle');
    expect(machine.context).toEqual({
      data: null,
      error: null,
      retryCount: 0,
    });
  });

  it('should transition on valid event', () => {
    const config = createTestMachineConfig();
    const machine = createMachine<TestStates, TestContext, TestEvents>(config);

    machine.send('FETCH');

    expect(machine.state).toBe('loading');
  });

  it('should not transition on invalid event', () => {
    const config = createTestMachineConfig();
    const machine = createMachine<TestStates, TestContext, TestEvents>(config);

    machine.send('SUCCESS'); // Invalid from 'idle'

    expect(machine.state).toBe('idle');
  });

  it('should update context with payload', () => {
    const config = createTestMachineConfig();
    const machine = createMachine<TestStates, TestContext, TestEvents>(config);

    machine.send('FETCH');
    machine.send('SUCCESS', { data: 'success data' });

    expect(machine.state).toBe('success');
    expect(machine.context.data).toBe('success data');
  });

  it('should check if transition is valid', () => {
    const config = createTestMachineConfig();
    const machine = createMachine<TestStates, TestContext, TestEvents>(config);

    expect(machine.can('FETCH')).toBe(true);
    expect(machine.can('SUCCESS')).toBe(false);
  });

  it('should reset to initial state', () => {
    const config = createTestMachineConfig();
    const machine = createMachine<TestStates, TestContext, TestEvents>(config);

    machine.send('FETCH');
    machine.send('SUCCESS', { data: 'some data' });
    machine.reset();

    expect(machine.state).toBe('idle');
  });

  it('should notify subscribers on state change', () => {
    const config = createTestMachineConfig();
    const machine = createMachine<TestStates, TestContext, TestEvents>(config);
    const listener = jest.fn();

    machine.subscribe(listener);

    // Subscriber is called immediately with current state
    expect(listener).toHaveBeenCalledWith('idle', expect.any(Object));

    machine.send('FETCH');

    expect(listener).toHaveBeenCalledWith('loading', expect.any(Object));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should return unsubscribe function', () => {
    const config = createTestMachineConfig();
    const machine = createMachine<TestStates, TestContext, TestEvents>(config);
    const listener = jest.fn();

    const unsubscribe = machine.subscribe(listener);
    unsubscribe();

    machine.send('FETCH');

    // Should only have the initial call, not the FETCH transition
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should return snapshot', () => {
    const config = createTestMachineConfig();
    const machine = createMachine<TestStates, TestContext, TestEvents>(config);

    const snapshot = machine.getSnapshot();

    expect(snapshot.state).toBe('idle');
    expect(snapshot.context).toEqual(expect.objectContaining({ data: null }));
  });
});

describe('useStateMachine', () => {
  it('should initialize with correct initial state', () => {
    const config = createTestMachineConfig();
    const { result } = renderHook(() => useStateMachine<TestStates, TestContext, TestEvents>(config));

    expect(result.current.state).toBe('idle');
    expect(result.current.context).toEqual({
      data: null,
      error: null,
      retryCount: 0,
    });
  });

  it('should transition to new state on valid event', () => {
    const config = createTestMachineConfig();
    const { result } = renderHook(() => useStateMachine<TestStates, TestContext, TestEvents>(config));

    act(() => {
      result.current.send('FETCH');
    });

    expect(result.current.state).toBe('loading');
  });

  it('should ignore invalid events for current state', () => {
    const config = createTestMachineConfig();
    const { result } = renderHook(() => useStateMachine<TestStates, TestContext, TestEvents>(config));

    act(() => {
      result.current.send('SUCCESS'); // Invalid from 'idle'
    });

    expect(result.current.state).toBe('idle');
  });

  it('should update context with payload', () => {
    const config = createTestMachineConfig();
    const { result } = renderHook(() => useStateMachine<TestStates, TestContext, TestEvents>(config));

    act(() => {
      result.current.send('FETCH');
    });
    act(() => {
      result.current.send('SUCCESS', { data: 'success data' });
    });

    expect(result.current.state).toBe('success');
    expect(result.current.context.data).toBe('success data');
  });

  it('should check if transition is valid with can()', () => {
    const config = createTestMachineConfig();
    const { result } = renderHook(() => useStateMachine<TestStates, TestContext, TestEvents>(config));

    expect(result.current.can('FETCH')).toBe(true);
    expect(result.current.can('SUCCESS')).toBe(false);
  });

  it('should reset to initial state', () => {
    const config = createTestMachineConfig();
    const { result } = renderHook(() => useStateMachine<TestStates, TestContext, TestEvents>(config));

    act(() => {
      result.current.send('FETCH');
      result.current.send('SUCCESS');
    });

    expect(result.current.state).toBe('success');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe('idle');
  });
});
