/**
 * CoreProviders - Consolidated essential providers
 * 
 * Combines core infrastructure providers that are always needed:
 * - QueryClient (TanStack Query)
 * - Theme
 * - Telegram
 * - Auth
 * - GuestMode
 * - Analytics (session, deeplinks, conversions)
 * 
 * This reduces the nesting depth and improves readability.
 */

import { ReactNode, memo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TelegramProvider } from '@/contexts/TelegramContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { GuestModeProvider } from '@/contexts/GuestModeContext';
import { AnalyticsProvider } from './AnalyticsProvider';

// Optimized QueryClient configuration for faster perceived loading
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
      retry: 1, // Single retry to fail fast
      refetchOnWindowFocus: false, // Prevent refetch on tab focus
      refetchOnReconnect: 'always',
      refetchOnMount: false, // Don't refetch if data exists
      networkMode: 'offlineFirst', // Use cache first, then network
    },
  },
});

interface CoreProvidersProps {
  children: ReactNode;
}

/**
 * Core infrastructure providers - always initialized at app start
 * Order: Theme → Telegram → Auth → GuestMode → Analytics
 * Analytics is last as it depends on Auth and Telegram context
 */
export const CoreProviders = memo(function CoreProviders({ children }: CoreProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TelegramProvider>
          <AuthProvider>
            <GuestModeProvider>
              <AnalyticsProvider>
                {children}
              </AnalyticsProvider>
            </GuestModeProvider>
          </AuthProvider>
        </TelegramProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
});
