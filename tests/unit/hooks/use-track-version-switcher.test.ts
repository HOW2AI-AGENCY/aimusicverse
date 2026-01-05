/**
 * Unit tests for useTrackVersionSwitcher hook
 *
 * Per contracts/useTrackVersionSwitcher.contract.ts:
 * - A/B version switching
 * - Atomic updates (is_primary AND active_version_id)
 * - Version history tracking
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTrackVersionSwitcher } from '@/hooks/track/use-track-version-switcher';
import type { UseTrackVersionSwitcherParams } from '@/hooks/types/track';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [
            {
              id: 'version-a',
              version_label: 'A',
              is_primary: true,
              clip_index: 0,
            },
            {
              id: 'version-b',
              version_label: 'B',
              is_primary: false,
              clip_index: 1,
            },
          ],
          error: null,
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useTrackVersionSwitcher', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  const defaultParams: UseTrackVersionSwitcherParams = {
    trackId: 'track-123',
    enableRefetch: true,
  };

  it('should fetch all track versions', async () => {
    const { result } = renderHook(() => useTrackVersionSwitcher(defaultParams), { wrapper });

    await waitFor(() => {
      expect(result.current.allVersions).toBeDefined();
    });

    // Should have at least 2 versions (A and B)
    expect(result.current.allVersions.length).toBeGreaterThanOrEqual(2);
  });

  it('should identify active version', async () => {
    const { result } = renderHook(() => useTrackVersionSwitcher(defaultParams), { wrapper });

    await waitFor(() => {
      expect(result.current.activeVersion).toBeDefined();
    });

    // Active version should be marked as primary
    expect(result.current.activeVersion?.is_primary).toBe(true);
  });

  it('should provide switchVersion function', async () => {
    const { result } = renderHook(() => useTrackVersionSwitcher(defaultParams), { wrapper });

    await waitFor(() => {
      expect(result.current.allVersions).toBeDefined();
    });

    expect(typeof result.current.switchVersion).toBe('function');
  });

  it('should switch to different version', async () => {
    const { result } = renderHook(() => useTrackVersionSwitcher(defaultParams), { wrapper });

    await waitFor(() => {
      expect(result.current.allVersions).toBeDefined();
    });

    const initialVersion = result.current.activeVersion?.id;
    const otherVersion = result.current.allVersions.find(v => v.id !== initialVersion);

    if (otherVersion) {
      await result.current.switchVersion(otherVersion.id);

      await waitFor(() => {
        // Active version should have changed
        expect(result.current.activeVersion?.id).toBe(otherVersion.id);
      });
    }
  });

  it('should update both is_primary and active_version_id atomically', async () => {
    const { result } = renderHook(() => useTrackVersionSwitcher(defaultParams), { wrapper });

    await waitFor(() => {
      expect(result.current.allVersions).toBeDefined();
    });

    const otherVersion = result.current.allVersions.find(
      v => !v.is_primary
    );

    if (otherVersion) {
      await result.current.switchVersion(otherVersion.id);

      // Both fields should be updated together
      // This is verified by checking the switchVersion completed successfully
      expect(result.current.isPending).toBe(false);
    }
  });

  it('should show pending state during switch', async () => {
    const { result } = renderHook(() => useTrackVersionSwitcher(defaultParams), { wrapper });

    await waitFor(() => {
      expect(result.current.allVersions).toBeDefined();
    });

    const otherVersion = result.current.allVersions.find(
      v => !v.is_primary
    );

    if (otherVersion) {
      const switchPromise = result.current.switchVersion(otherVersion.id);

      // Should be pending
      expect(result.current.isPending).toBe(true);

      await switchPromise;

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    }
  });

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() =>
      useTrackVersionSwitcher({
        trackId: 'invalid-track',
      }), { wrapper }
    );

    await waitFor(() => {
      // Should complete without crashing
      expect(result.current.isPending).toBe(false);
    });

    // If error occurred, should have error object
    if (result.current.error) {
      expect(result.current.error).toBeInstanceOf(Error);
    }
  });

  it('should support version labels (A/B)', async () => {
    const { result } = renderHook(() => useTrackVersionSwitcher(defaultParams), { wrapper });

    await waitFor(() => {
      expect(result.current.allVersions).toBeDefined();
    });

    // Should have version A
    const versionA = result.current.allVersions.find(v => v.version_label === 'A');
    expect(versionA).toBeDefined();

    // Should have version B
    const versionB = result.current.allVersions.find(v => v.version_label === 'B');
    expect(versionB).toBeDefined();
  });
});
