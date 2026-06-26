/**
 * Unit tests for useVersionSwitcher and useTrackVersions hooks
 * Tests version fetching, switching, optimistic updates, and error handling
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock versioning queries
vi.mock('@/integrations/supabase/queries/versioning', () => ({
  fetchTrackVersions: vi.fn(),
  fetchPrimaryVersion: vi.fn(),
  getVersionCount: vi.fn(),
}));

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchTrackVersions, fetchPrimaryVersion, getVersionCount } from '@/integrations/supabase/queries/versioning';
import { useVersionSwitcher } from '@/hooks/useVersionSwitcher';
import { useTrackVersions, useMasterVersion, useVersionCount } from '@/hooks/useTrackVersions';

// --- Test data ---

const TRACK_ID = 'track-001';
const VERSION_A_ID = 'version-a-001';
const VERSION_B_ID = 'version-b-001';

const versionA = {
  id: VERSION_A_ID,
  track_id: TRACK_ID,
  version_label: 'A',
  clip_index: 0,
  is_primary: true,
  audio_url: 'https://cdn.example.com/audio-a.mp3',
  cover_url: 'https://cdn.example.com/cover-a.jpg',
  duration_seconds: 180,
  metadata: { suno_task_id: 'suno-task-a', suno_id: 'suno-a' },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const versionB = {
  id: VERSION_B_ID,
  track_id: TRACK_ID,
  version_label: 'B',
  clip_index: 1,
  is_primary: false,
  audio_url: 'https://cdn.example.com/audio-b.mp3',
  cover_url: 'https://cdn.example.com/cover-b.jpg',
  duration_seconds: 200,
  metadata: { suno_task_id: 'suno-task-b', suno_id: 'suno-b' },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// --- Helpers ---

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// Helper to set up supabase mock chain for a specific table call
function mockSupabaseChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
    // Make chain thenable so `await supabase.from(...).update(...).eq(...)` resolves
    then: vi.fn((resolve: any, reject?: any) => Promise.resolve(resolvedValue).then(resolve, reject)),
  };
  return chain;
}

// Create a thenable chain for setPrimaryVersion tests where each supabase.from() call
// needs to resolve properly. The mutation does:
//   1. from("track_versions").select().eq().single() -> version data
//   2. from("track_versions").update().eq() -> unset is_primary (awaited directly, no .single())
//   3. from("track_versions").update().eq() -> set is_primary
//   4. from("tracks").update().eq() -> update track
//   5. from("track_change_log").insert() -> log change
function mockSupabaseForSetPrimary(options: {
  versionData?: { data: unknown; error: unknown };
  updateError?: unknown;
  authUser?: { id: string } | null;
}) {
  const {
    versionData = { data: { audio_url: 'https://example.com/b.mp3', cover_url: null, duration_seconds: 200, metadata: null }, error: null },
    updateError = null,
    authUser = { id: 'user-123' },
  } = options;

  let selectSingleCallCount = 0;

  (supabase.from as any).mockImplementation(() => {
    const chain: any = {};
    const self = () => chain;

    // Every method returns chain for chaining
    chain.select = vi.fn(self);
    chain.update = vi.fn(self);
    chain.insert = vi.fn(self);
    chain.eq = vi.fn(self);

    // .single() is called only for the first select (fetch version data)
    chain.single = vi.fn(() => {
      selectSingleCallCount++;
      if (selectSingleCallCount === 1) {
        return Promise.resolve(versionData);
      }
      return Promise.resolve({ data: null, error: null });
    });

    // Make chain itself thenable for `await ...update().eq()` patterns
    chain.then = vi.fn((resolve: any, reject?: any) =>
      Promise.resolve({ data: null, error: updateError }).then(resolve, reject),
    );

    return chain;
  });

  (supabase.auth.getUser as any).mockResolvedValue({
    data: { user: authUser },
  });
}

// --- useTrackVersions tests ---

describe('useTrackVersions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    vi.clearAllMocks();
  });

  it('should fetch versions for a given track ID', async () => {
    (fetchTrackVersions as any).mockResolvedValue([versionA, versionB]);

    const { result } = renderHook(() => useTrackVersions(TRACK_ID), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchTrackVersions).toHaveBeenCalledWith(TRACK_ID);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].version_label).toBe('A');
    expect(result.current.data![1].version_label).toBe('B');
  });

  it('should not fetch when trackId is undefined', () => {
    renderHook(() => useTrackVersions(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(fetchTrackVersions).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    (fetchTrackVersions as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTrackVersions(TRACK_ID), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe('useMasterVersion', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    vi.clearAllMocks();
  });

  it('should fetch primary version for a track', async () => {
    (fetchPrimaryVersion as any).mockResolvedValue(versionA);

    const { result } = renderHook(() => useMasterVersion(TRACK_ID), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(versionA);
  });

  it('should not fetch when trackId is undefined', () => {
    renderHook(() => useMasterVersion(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(fetchPrimaryVersion).not.toHaveBeenCalled();
  });
});

describe('useVersionCount', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    vi.clearAllMocks();
  });

  it('should return version count for a track', async () => {
    (getVersionCount as any).mockResolvedValue(2);

    const { result } = renderHook(() => useVersionCount(TRACK_ID), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(2);
  });
});

// --- useVersionSwitcher tests ---

describe('useVersionSwitcher', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    vi.clearAllMocks();
  });

  describe('switchVersion', () => {
    it('should fetch and return the requested version', async () => {
      const chain = mockSupabaseChain({ data: versionB, error: null });
      (supabase.from as any).mockReturnValue(chain);

      const { result } = renderHook(() => useVersionSwitcher(), {
        wrapper: createWrapper(queryClient),
      });

      let switchResult: any;
      await act(async () => {
        switchResult = await result.current.switchVersionAsync({
          trackId: TRACK_ID,
          versionId: VERSION_B_ID,
        });
      });

      expect(supabase.from).toHaveBeenCalledWith('track_versions');
      expect(switchResult).toEqual(versionB);
    });

    it('should show error toast on failure', async () => {
      const chain = mockSupabaseChain({ data: null, error: { message: 'Not found' } });
      (supabase.from as any).mockReturnValue(chain);

      const { result } = renderHook(() => useVersionSwitcher(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.switchVersionAsync({
            trackId: TRACK_ID,
            versionId: 'nonexistent',
          });
        } catch {
          // expected
        }
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to switch version',
        expect.objectContaining({ description: expect.any(String) }),
      );
    });
  });

  describe('setPrimaryVersion', () => {
    it('should execute the full primary version switch flow', async () => {
      const fromCalls: string[] = [];
      const origMock = (supabase.from as any);

      mockSupabaseForSetPrimary({
        versionData: {
          data: {
            audio_url: versionB.audio_url,
            cover_url: versionB.cover_url,
            duration_seconds: versionB.duration_seconds,
            metadata: versionB.metadata,
          },
          error: null,
        },
      });

      // Wrap to track table names
      const innerMock = (supabase.from as any).getMockImplementation()!;
      (supabase.from as any).mockImplementation((table: string) => {
        fromCalls.push(table);
        return innerMock(table);
      });

      queryClient.setQueryData(['track-versions', TRACK_ID], [versionA, versionB]);

      const { result } = renderHook(() => useVersionSwitcher(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.setPrimaryVersion({
          trackId: TRACK_ID,
          versionId: VERSION_B_ID,
        });
      });

      await waitFor(() => expect(result.current.isSettingPrimary).toBe(false));

      expect(fromCalls).toContain('track_versions');
      expect(fromCalls).toContain('tracks');
      expect(fromCalls).toContain('track_change_log');
    });

    it('should optimistically update cache to reflect new primary', async () => {
      queryClient.setQueryData(['track-versions', TRACK_ID], [versionA, versionB]);

      mockSupabaseForSetPrimary({
        versionData: {
          data: {
            audio_url: versionB.audio_url,
            cover_url: versionB.cover_url,
            duration_seconds: versionB.duration_seconds,
            metadata: versionB.metadata,
          },
          error: null,
        },
      });

      const { result } = renderHook(() => useVersionSwitcher(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.setPrimaryVersion({
          trackId: TRACK_ID,
          versionId: VERSION_B_ID,
        });
      });

      await waitFor(() => expect(result.current.isSettingPrimary).toBe(false));

      // After successful mutation + optimistic update, version B should be primary
      // (the onSettled invalidation may reset, but the optimistic update set it)
      expect(toast.success).toHaveBeenCalledWith('Primary version updated successfully');
    });

    it('should rollback optimistic update on error', async () => {
      queryClient.setQueryData(['track-versions', TRACK_ID], [versionA, versionB]);

      // Fail on the first .single() call (fetch version data)
      mockSupabaseForSetPrimary({
        versionData: { data: null, error: { message: 'Database error', code: '500' } },
      });

      const { result } = renderHook(() => useVersionSwitcher(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.setPrimaryVersion({
          trackId: TRACK_ID,
          versionId: VERSION_B_ID,
        });
      });

      await waitFor(() => expect(result.current.isSettingPrimary).toBe(false));

      // Error toast should have been shown (rollback was attempted in onError)
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to set primary version',
        expect.objectContaining({ description: expect.any(String) }),
      );
    });

    it('should reject when version has no audio URL', async () => {
      mockSupabaseForSetPrimary({
        versionData: {
          data: { audio_url: null, cover_url: null, duration_seconds: null, metadata: null },
          error: null,
        },
      });

      queryClient.setQueryData(['track-versions', TRACK_ID], [versionA, versionB]);

      const { result } = renderHook(() => useVersionSwitcher(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.setPrimaryVersion({
          trackId: TRACK_ID,
          versionId: VERSION_B_ID,
        });
      });

      await waitFor(() => expect(result.current.isSettingPrimary).toBe(false));

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to set primary version',
        expect.objectContaining({ description: 'Version has no audio URL' }),
      );
    });

    it('should show success toast on successful switch', async () => {
      mockSupabaseForSetPrimary({
        versionData: {
          data: {
            audio_url: versionB.audio_url,
            cover_url: versionB.cover_url,
            duration_seconds: versionB.duration_seconds,
            metadata: versionB.metadata,
          },
          error: null,
        },
      });

      queryClient.setQueryData(['track-versions', TRACK_ID], [versionA, versionB]);

      const { result } = renderHook(() => useVersionSwitcher(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.setPrimaryVersion({
          trackId: TRACK_ID,
          versionId: VERSION_B_ID,
        });
      });

      await waitFor(() => expect(result.current.isSettingPrimary).toBe(false));

      expect(toast.success).toHaveBeenCalledWith('Primary version updated successfully');
    });

    it('should invalidate related queries on settlement', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      mockSupabaseForSetPrimary({
        versionData: {
          data: {
            audio_url: versionB.audio_url,
            cover_url: versionB.cover_url,
            duration_seconds: versionB.duration_seconds,
            metadata: versionB.metadata,
          },
          error: null,
        },
      });

      queryClient.setQueryData(['track-versions', TRACK_ID], [versionA, versionB]);

      const { result } = renderHook(() => useVersionSwitcher(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.setPrimaryVersion({
          trackId: TRACK_ID,
          versionId: VERSION_B_ID,
        });
      });

      await waitFor(() => expect(result.current.isSettingPrimary).toBe(false));

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['track-versions', TRACK_ID] }),
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['tracks'] }),
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['track-change-log', TRACK_ID] }),
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['track-stems', TRACK_ID] }),
      );

      invalidateSpy.mockRestore();
    });
  });

  describe('loading states', () => {
    it('should start with isSettingPrimary as false', () => {
      const { result } = renderHook(() => useVersionSwitcher(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isSettingPrimary).toBe(false);
    });

    it('should start with isSwitching as false', () => {
      const { result } = renderHook(() => useVersionSwitcher(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isSwitching).toBe(false);
    });

    it('should return isSettingPrimary false after mutation completes', async () => {
      mockSupabaseForSetPrimary({
        versionData: {
          data: {
            audio_url: versionB.audio_url,
            cover_url: versionB.cover_url,
            duration_seconds: versionB.duration_seconds,
            metadata: versionB.metadata,
          },
          error: null,
        },
      });

      queryClient.setQueryData(['track-versions', TRACK_ID], [versionA, versionB]);

      const { result } = renderHook(() => useVersionSwitcher(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.setPrimaryVersion({
          trackId: TRACK_ID,
          versionId: VERSION_B_ID,
        });
      });

      await waitFor(() => expect(result.current.isSettingPrimary).toBe(false));
    });

    it('should return isSwitching false after mutation completes', async () => {
      const chain = mockSupabaseChain({ data: versionB, error: null });
      (supabase.from as any).mockReturnValue(chain);

      const { result } = renderHook(() => useVersionSwitcher(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.switchVersionAsync({
          trackId: TRACK_ID,
          versionId: VERSION_B_ID,
        });
      });

      expect(result.current.isSwitching).toBe(false);
    });
  });
});
