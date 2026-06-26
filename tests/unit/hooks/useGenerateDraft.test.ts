import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useGenerateDraft } from '@/hooks/generation/useGenerateDraft';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const DRAFT_KEY = 'generate_form_draft';

describe('useGenerateDraft', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should start with no draft', () => {
    const { result } = renderHook(() => useGenerateDraft());
    expect(result.current.hasDraft).toBe(false);
    expect(result.current.draft).toBeNull();
  });

  it('should save draft with content', () => {
    const { result } = renderHook(() => useGenerateDraft());

    act(() => {
      result.current.saveDraft({ title: 'My Song', description: 'A cool song' });
    });

    expect(result.current.hasDraft).toBe(true);
    expect(result.current.draft?.title).toBe('My Song');
    expect(localStorage.getItem(DRAFT_KEY)).toBeTruthy();
  });

  it('should not save draft without content', () => {
    const { result } = renderHook(() => useGenerateDraft());

    act(() => {
      result.current.saveDraft({ hasVocals: false });
    });

    expect(result.current.hasDraft).toBe(false);
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('should load existing draft on mount', async () => {
    const draft = {
      mode: 'simple',
      description: 'Test desc',
      title: 'Test',
      lyrics: '',
      style: '',
      hasVocals: true,
      model: 'V4_5ALL',
      negativeTags: '',
      vocalGender: '',
      savedAt: Date.now(),
      version: 1,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

    const { result } = renderHook(() => useGenerateDraft());

    await waitFor(() => {
      expect(result.current.hasDraft).toBe(true);
    });
    expect(result.current.draft?.title).toBe('Test');
  });

  it('should not load expired draft', async () => {
    const draft = {
      mode: 'simple',
      description: 'Old',
      title: 'Expired',
      lyrics: '',
      style: '',
      hasVocals: true,
      model: 'V4_5ALL',
      negativeTags: '',
      vocalGender: '',
      savedAt: Date.now() - 31 * 60 * 1000, // 31 min ago
      version: 1,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

    const { result } = renderHook(() => useGenerateDraft());

    await waitFor(() => {
      expect(result.current.hasDraft).toBe(false);
    });
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('should clear draft', () => {
    const { result } = renderHook(() => useGenerateDraft());

    act(() => {
      result.current.saveDraft({ title: 'To delete' });
    });
    expect(result.current.hasDraft).toBe(true);

    act(() => {
      result.current.clearDraft();
    });
    expect(result.current.hasDraft).toBe(false);
    expect(result.current.draft).toBeNull();
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('should reject draft with wrong version', async () => {
    const draft = {
      mode: 'simple',
      description: 'Old version',
      title: 'V0',
      lyrics: '',
      style: '',
      hasVocals: true,
      model: 'V4_5ALL',
      negativeTags: '',
      vocalGender: '',
      savedAt: Date.now(),
      version: 999,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

    const { result } = renderHook(() => useGenerateDraft());

    await waitFor(() => {
      expect(result.current.hasDraft).toBe(false);
    });
  });

  it('should auto-save with debounce', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGenerateDraft());

    act(() => {
      result.current.autoSaveDraft({ title: 'Auto' });
    });

    expect(result.current.isAutoSaving).toBe(true);
    expect(result.current.hasDraft).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.hasDraft).toBe(true);
    expect(result.current.draft?.title).toBe('Auto');
    expect(result.current.isAutoSaving).toBe(false);

    vi.useRealTimers();
  });

  it('should debounce multiple auto-save calls', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGenerateDraft());

    act(() => {
      result.current.autoSaveDraft({ title: 'First' });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      result.current.autoSaveDraft({ title: 'Second' });
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.draft?.title).toBe('Second');

    vi.useRealTimers();
  });

  it('should handle corrupted localStorage gracefully', async () => {
    localStorage.setItem(DRAFT_KEY, 'not-json');

    const { result } = renderHook(() => useGenerateDraft());

    await waitFor(() => {
      expect(result.current.hasDraft).toBe(false);
    });
  });
});
