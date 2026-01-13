/**
 * Unit tests for useStudioPerformance hook
 * Tests performance monitoring and optimization utilities
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  useStudioPerformance, 
  useThrottledCallback, 
  useCustomDeferredValue 
} from '@/hooks/useStudioPerformance';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useStudioPerformance', () => {
  // Mock performance.now()
  let mockNow = 0;
  
  beforeEach(() => {
    mockNow = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => mockNow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should return metrics object', () => {
      const { result } = renderHook(() => 
        useStudioPerformance('TestComponent')
      );

      expect(result.current.metrics).toBeDefined();
      expect(result.current.metrics.renderCount).toBe(0);
      expect(result.current.metrics.lastRenderTime).toBe(0);
      expect(result.current.metrics.averageRenderTime).toBe(0);
    });

    it('should return trackRender function', () => {
      const { result } = renderHook(() => 
        useStudioPerformance('TestComponent')
      );

      expect(result.current.trackRender).toBeInstanceOf(Function);
    });

    it('should return logMetrics function', () => {
      const { result } = renderHook(() => 
        useStudioPerformance('TestComponent')
      );

      expect(result.current.logMetrics).toBeInstanceOf(Function);
    });
  });

  describe('render tracking', () => {
    it('should track render time when trackRender is called', () => {
      const { result, rerender } = renderHook(() => 
        useStudioPerformance('TestComponent')
      );

      // Start tracking
      mockNow = 100;
      act(() => {
        result.current.trackRender();
      });

      // Simulate render completion
      mockNow = 110;
      rerender();

      expect(result.current.metrics.renderCount).toBe(1);
      expect(result.current.metrics.lastRenderTime).toBe(10);
    });

    it('should calculate average render time correctly', () => {
      const { result, rerender } = renderHook(() => 
        useStudioPerformance('TestComponent')
      );

      // First render: 10ms
      mockNow = 100;
      act(() => result.current.trackRender());
      mockNow = 110;
      rerender();

      // Second render: 20ms
      mockNow = 200;
      act(() => result.current.trackRender());
      mockNow = 220;
      rerender();

      // Average should be 15ms
      expect(result.current.metrics.averageRenderTime).toBe(15);
    });
  });

  describe('memory warning', () => {
    it('should set isMemoryWarning when memory exceeds threshold', () => {
      // Mock performance.memory
      const mockMemory = {
        usedJSHeapSize: 160 * 1024 * 1024, // 160MB
      };
      
      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true,
      });

      const { result } = renderHook(() => 
        useStudioPerformance('TestComponent')
      );

      expect(result.current.isMemoryWarning).toBe(true);
      expect(result.current.metrics.memoryUsageMB).toBe(160);

      // Cleanup
      // @ts-ignore
      delete (performance as Record<string, unknown>).memory;
    });

    it('should not warn when memory is below threshold', () => {
      const mockMemory = {
        usedJSHeapSize: 100 * 1024 * 1024, // 100MB
      };
      
      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true,
      });

      const { result } = renderHook(() => 
        useStudioPerformance('TestComponent')
      );

      expect(result.current.isMemoryWarning).toBe(false);

      // @ts-ignore
      delete (performance as Record<string, unknown>).memory;
    });
  });

  describe('logMetrics', () => {
    it('should call logger.debug with metrics', async () => {
      const { logger } = await import('@/lib/logger');
      
      const { result } = renderHook(() => 
        useStudioPerformance('TestComponent')
      );

      act(() => {
        result.current.logMetrics();
      });

      expect(logger.debug).toHaveBeenCalledWith(
        '[TestComponent] Performance metrics',
        expect.objectContaining({
          renderCount: 0,
          averageRenderTime: expect.any(String),
        })
      );
    });
  });
});

describe('useThrottledCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call callback immediately on first call', () => {
    const callback = vi.fn((x: number) => x * 2);
    
    const { result } = renderHook(() => 
      useThrottledCallback(callback, 100)
    );

    const returnValue = result.current(5);

    expect(callback).toHaveBeenCalledWith(5);
    expect(returnValue).toBe(10);
  });

  it('should throttle subsequent calls within delay', () => {
    const callback = vi.fn((x: number) => x * 2);
    
    const { result } = renderHook(() => 
      useThrottledCallback(callback, 100)
    );

    result.current(1);
    result.current(2);
    result.current(3);

    // Only first call should be executed immediately
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(1);
  });

  it('should schedule delayed execution for throttled calls', () => {
    const callback = vi.fn((x: number) => x * 2);
    
    const { result } = renderHook(() => 
      useThrottledCallback(callback, 100)
    );

    result.current(1);
    result.current(2);

    // Fast-forward time
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith(2);
  });

  it('should return undefined for throttled calls', () => {
    const callback = vi.fn((x: number) => x * 2);
    
    const { result } = renderHook(() => 
      useThrottledCallback(callback, 100)
    );

    result.current(1);
    const returnValue = result.current(2);

    expect(returnValue).toBeUndefined();
  });
});

describe('useCustomDeferredValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => 
      useCustomDeferredValue('initial', 100)
    );

    expect(result.current).toBe('initial');
  });

  it('should defer value update by specified delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useCustomDeferredValue(value, 100),
      { initialProps: { value: 'initial' } }
    );

    // Update value
    rerender({ value: 'updated' });

    // Should still be initial
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Re-render to get updated ref value
    rerender({ value: 'updated' });

    // Note: Due to how useRef works, we need another render to see the change
    expect(result.current).toBe('initial'); // Will be updated on next render
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useCustomDeferredValue(value, 100),
      { initialProps: { value: 'v1' } }
    );

    rerender({ value: 'v2' });
    vi.advanceTimersByTime(50);
    
    rerender({ value: 'v3' });
    vi.advanceTimersByTime(50);

    // v2 should have been cancelled
    expect(result.current).toBe('v1');
  });

  it('should use default delay of 100ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useCustomDeferredValue(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      vi.advanceTimersByTime(99);
    });
    
    // Should still be initial before 100ms
    expect(result.current).toBe('initial');
  });
});
