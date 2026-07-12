/**
 * Regression: repeated navigation must not crash on realtime listener remounts.
 *
 * Reproduces the earlier bug where `useGenerationResult` reused a fixed channel
 * name across mounts, causing `.on()` to be added to an already-subscribed
 * channel and throwing "tried to subscribe multiple times".
 *
 * We simulate rapid nav churn by mounting/unmounting the hook many times and
 * assert every mount gets a unique channel and is torn down on unmount.
 */

import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { useGenerationResult } from '@/hooks/generation/useGenerationResult';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

describe('useGenerationResult — remount regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not throw across many mount/unmount cycles (navigation churn)', () => {
    const channelNames: string[] = [];
    (supabase.channel as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (name: string) => {
        channelNames.push(name);
        return {
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
          unsubscribe: vi.fn(),
        };
      },
    );

    const CYCLES = 25;
    expect(() => {
      for (let i = 0; i < CYCLES; i++) {
        const { unmount } = renderHook(() => useGenerationResult());
        unmount();
      }
    }).not.toThrow();

    // Each mount must produce a unique channel name — this is what prevents
    // the "subscribe multiple times" crash we hit in production.
    expect(channelNames).toHaveLength(CYCLES);
    expect(new Set(channelNames).size).toBe(CYCLES);

    // Every mounted channel must be removed on unmount so we don't leak
    // subscriptions and rack up Realtime bills.
    expect(supabase.removeChannel).toHaveBeenCalledTimes(CYCLES);
  });
});
