import { cn } from '@/lib/utils';
import { useTelegramIntegration } from '@/hooks/useTelegramIntegration';

interface TelegramSafeAreaProps {
  children: React.ReactNode;
  className?: string;
  /** Include bottom padding for BottomNavigation (default: true) */
  withBottomNav?: boolean;
}

/**
 * Universal wrapper component for Telegram Mini App safe areas
 * Handles both Telegram CSS variables and iOS Safari safe-area-inset
 */
export function TelegramSafeArea({ 
  children, 
  className,
  withBottomNav = true 
}: TelegramSafeAreaProps) {
  const { isTelegramAvailable } = useTelegramIntegration();

  return (
    <div
      className={cn("min-h-screen", className)}
      style={{
        paddingTop: isTelegramAvailable 
          ? 'calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)) + 12px)'
          : 'env(safe-area-inset-top, 0px)',
        paddingBottom: withBottomNav
          ? 'calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)) + 80px)'
          : 'calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)) + 16px)',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Hook to get safe area insets for manual styling
 */
export function useTelegramSafeAreaStyle(withBottomNav = true) {
  const { isTelegramAvailable } = useTelegramIntegration();

  return {
    paddingTop: isTelegramAvailable 
      ? 'calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)) + 12px)'
      : 'env(safe-area-inset-top, 0px)',
    paddingBottom: withBottomNav
      ? 'calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)) + 80px)'
      : 'calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)) + 16px)',
  };
}
