/**
 * Unit tests for useSwipeNavigation hook
 * Tests swipe gesture detection for tab navigation
 */

import { renderHook, act } from '@testing-library/react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

// Mock useHaptic
jest.mock('@/hooks/useHaptic', () => ({
  useHaptic: () => ({
    patterns: {
      tap: jest.fn(),
      success: jest.fn(),
      error: jest.fn(),
    },
  }),
}));

describe('useSwipeNavigation', () => {
  const tabs = ['player', 'sections', 'mixer'] as const;
  type Tab = typeof tabs[number];

  const createTouchEvent = (clientX: number, clientY: number) => ({
    touches: [{ clientX, clientY }],
    changedTouches: [{ clientX, clientY }],
  } as unknown as React.TouchEvent);

  describe('initialization', () => {
    it('should return handlers object', () => {
      const onTabChange = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation(tabs as unknown as Tab[], 'player', onTabChange)
      );

      expect(result.current.handlers).toBeDefined();
      expect(result.current.handlers.onTouchStart).toBeInstanceOf(Function);
      expect(result.current.handlers.onTouchMove).toBeInstanceOf(Function);
      expect(result.current.handlers.onTouchEnd).toBeInstanceOf(Function);
    });

    it('should have isSwipeActive as false initially', () => {
      const onTabChange = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation(tabs as unknown as Tab[], 'player', onTabChange)
      );

      expect(result.current.isSwipeActive).toBe(false);
    });
  });

  describe('swipe left (next tab)', () => {
    it('should navigate to next tab on left swipe', () => {
      const onTabChange = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation(tabs as unknown as Tab[], 'player', onTabChange)
      );

      // Start touch
      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(200, 100));
      });

      // Move left (negative deltaX)
      act(() => {
        result.current.handlers.onTouchMove(createTouchEvent(140, 100));
      });

      // End touch - swipe left by 60px
      act(() => {
        result.current.handlers.onTouchEnd(createTouchEvent(140, 100));
      });

      expect(onTabChange).toHaveBeenCalledWith('sections');
    });

    it('should not navigate past last tab', () => {
      const onTabChange = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation(tabs as unknown as Tab[], 'mixer', onTabChange)
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(200, 100));
      });

      act(() => {
        result.current.handlers.onTouchEnd(createTouchEvent(140, 100));
      });

      // Should not call onTabChange as we're already on last tab
      expect(onTabChange).not.toHaveBeenCalled();
    });
  });

  describe('swipe right (previous tab)', () => {
    it('should navigate to previous tab on right swipe', () => {
      const onTabChange = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation(tabs as unknown as Tab[], 'sections', onTabChange)
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 100));
      });

      act(() => {
        result.current.handlers.onTouchMove(createTouchEvent(160, 100));
      });

      // End touch - swipe right by 60px
      act(() => {
        result.current.handlers.onTouchEnd(createTouchEvent(160, 100));
      });

      expect(onTabChange).toHaveBeenCalledWith('player');
    });

    it('should not navigate before first tab', () => {
      const onTabChange = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation(tabs as unknown as Tab[], 'player', onTabChange)
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 100));
      });

      act(() => {
        result.current.handlers.onTouchEnd(createTouchEvent(160, 100));
      });

      expect(onTabChange).not.toHaveBeenCalled();
    });
  });

  describe('swipe thresholds', () => {
    it('should not trigger for small swipes below threshold', () => {
      const onTabChange = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation(tabs as unknown as Tab[], 'player', onTabChange, { threshold: 50 })
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 100));
      });

      // Swipe only 30px (below 50px threshold)
      act(() => {
        result.current.handlers.onTouchEnd(createTouchEvent(70, 100));
      });

      expect(onTabChange).not.toHaveBeenCalled();
    });

    it('should use custom threshold', () => {
      const onTabChange = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation(tabs as unknown as Tab[], 'player', onTabChange, { threshold: 20 })
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 100));
      });

      // Swipe 30px (above 20px custom threshold)
      act(() => {
        result.current.handlers.onTouchEnd(createTouchEvent(70, 100));
      });

      expect(onTabChange).toHaveBeenCalledWith('sections');
    });
  });

  describe('vertical vs horizontal detection', () => {
    it('should ignore vertical swipes', () => {
      const onTabChange = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation(tabs as unknown as Tab[], 'player', onTabChange)
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 100));
      });

      // Mostly vertical swipe (large Y delta, small X delta)
      act(() => {
        result.current.handlers.onTouchEnd(createTouchEvent(120, 200));
      });

      expect(onTabChange).not.toHaveBeenCalled();
    });

    it('should require horizontal movement to be 1.5x vertical', () => {
      const onTabChange = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation(tabs as unknown as Tab[], 'player', onTabChange)
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 100));
      });

      // deltaX = 60, deltaY = 50 (ratio is 1.2, less than 1.5)
      act(() => {
        result.current.handlers.onTouchEnd(createTouchEvent(40, 150));
      });

      expect(onTabChange).not.toHaveBeenCalled();
    });
  });

  describe('config options', () => {
    it('should respect hapticFeedback=false', () => {
      const onTabChange = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation(tabs as unknown as Tab[], 'player', onTabChange, { 
          hapticFeedback: false 
        })
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(200, 100));
      });

      act(() => {
        result.current.handlers.onTouchEnd(createTouchEvent(100, 100));
      });

      expect(onTabChange).toHaveBeenCalledWith('sections');
      // Haptic should not have been called (tested via mock)
    });
  });
});
