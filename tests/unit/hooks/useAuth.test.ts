/**
 * Unit tests for AuthContext - authentication flow
 */

import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';

vi.mock('@/contexts/TelegramContext', () => ({
  useTelegram: () => ({
    initData: 'mock-init-data',
    isDevelopmentMode: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/analytics/deeplink-tracker', () => ({
  flushBufferedDeeplinkTracks: vi.fn().mockResolvedValue(undefined),
}));

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null, children);

describe('AuthContext', () => {
  describe('useAuth', () => {
    it('should throw when used outside AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });

    it('should provide auth context when within AuthProvider', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('session');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('authenticateWithTelegram');
      expect(result.current).toHaveProperty('logout');
    });

    it('should set isAuthenticated to false when no user', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should have authenticateWithTelegram function', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.authenticateWithTelegram).toBe('function');
    });

    it('should have logout function', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.logout).toBe('function');
    });
  });
});
