import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import {
  expectGenerationResult,
  clearGenerationExpectation,
  isExpectingResult,
  useGenerationResult,
} from '@/hooks/generation/useGenerationResult';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

const EXPECT_RESULT_KEY = 'generation_expect_result';

describe('Generation result utilities', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('expectGenerationResult sets flag', () => {
    expectGenerationResult();
    expect(sessionStorage.getItem(EXPECT_RESULT_KEY)).toBe('true');
  });

  it('clearGenerationExpectation removes flag', () => {
    expectGenerationResult();
    clearGenerationExpectation();
    expect(sessionStorage.getItem(EXPECT_RESULT_KEY)).toBeNull();
  });

  it('isExpectingResult returns correct state', () => {
    expect(isExpectingResult()).toBe(false);
    expectGenerationResult();
    expect(isExpectingResult()).toBe(true);
  });
});

describe('useGenerationResult', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should start closed with no track', () => {
    const { result } = renderHook(() => useGenerationResult());
    expect(result.current.resultOpen).toBe(false);
    expect(result.current.resultTrackId).toBeNull();
  });

  it('showResult opens with track info', () => {
    const { result } = renderHook(() => useGenerationResult());

    act(() => {
      result.current.showResult('track-1', 'My Song');
    });

    expect(result.current.resultOpen).toBe(true);
    expect(result.current.resultTrackId).toBe('track-1');
    expect(result.current.resultTrackTitle).toBe('My Song');
  });

  it('showResult clears expectation flag', () => {
    expectGenerationResult();
    const { result } = renderHook(() => useGenerationResult());

    act(() => {
      result.current.showResult('track-1');
    });

    expect(isExpectingResult()).toBe(false);
  });

  it('should not show same track twice', () => {
    const { result } = renderHook(() => useGenerationResult());

    act(() => {
      result.current.showResult('track-1', 'Song');
    });
    act(() => {
      result.current.closeResult();
    });
    act(() => {
      result.current.showResult('track-1', 'Song');
    });

    expect(result.current.resultOpen).toBe(false);
  });

  it('closeResult closes but keeps track info', () => {
    const { result } = renderHook(() => useGenerationResult());

    act(() => {
      result.current.showResult('track-1', 'Song');
    });
    act(() => {
      result.current.closeResult();
    });

    expect(result.current.resultOpen).toBe(false);
    expect(result.current.resultTrackId).toBe('track-1');
  });

  it('clearResult resets everything', () => {
    const { result } = renderHook(() => useGenerationResult());

    act(() => {
      result.current.showResult('track-1', 'Song');
    });
    act(() => {
      result.current.clearResult();
    });

    expect(result.current.resultOpen).toBe(false);
    expect(result.current.resultTrackId).toBeNull();
    expect(result.current.resultTrackTitle).toBeNull();
  });

  it('setResultOpen(false) closes result', () => {
    const { result } = renderHook(() => useGenerationResult());

    act(() => {
      result.current.showResult('track-1');
    });
    act(() => {
      result.current.setResultOpen(false);
    });

    expect(result.current.resultOpen).toBe(false);
  });

  it('setResultOpen(true) does nothing without track', () => {
    const { result } = renderHook(() => useGenerationResult());

    act(() => {
      result.current.setResultOpen(true);
    });

    expect(result.current.resultOpen).toBe(false);
  });
});
