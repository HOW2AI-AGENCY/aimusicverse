/**
 * FeatureProviders - Consolidated feature-related providers
 * 
 * Combines providers for app features:
 * - GlobalAudio (audio playback)
 * - Notifications (realtime updates)
 * - Announcements (system messages)
 * - Gamification + Rewards (achievements, rewards - already coupled)
 * - Paywall (subscription triggers)
 * 
 * Performance: Heavy providers are deferred to not block initial render
 */

import { ReactNode, memo, lazy, Suspense, useState, useEffect } from 'react';
import { GlobalAudioProvider } from '@/components/GlobalAudioProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AnnouncementProvider } from '@/contexts/AnnouncementContext';

// Lazy load heavy providers to not block initial render
const RewardNotificationProvider = lazy(() => 
  import('@/contexts/RewardNotificationContext').then(m => ({ default: m.RewardNotificationProvider }))
);
const GamificationProvider = lazy(() => 
  import('@/contexts/GamificationContext').then(m => ({ default: m.GamificationProvider }))
);
const PaywallProvider = lazy(() => 
  import('@/components/premium/PaywallProvider').then(m => ({ default: m.PaywallProvider }))
);

interface FeatureProvidersProps {
  children: ReactNode;
}

// Deferred wrapper - delays heavy providers until after first paint
function DeferredProviders({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Delay loading heavy providers until after initial render
    let timerId: number;
    
    if (typeof requestIdleCallback !== 'undefined') {
      timerId = requestIdleCallback(() => setMounted(true));
    } else {
      timerId = window.setTimeout(() => setMounted(true), 100) as unknown as number;
    }
    
    return () => {
      if (typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(timerId);
      } else {
        clearTimeout(timerId);
      }
    };
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <RewardNotificationProvider>
        <GamificationProvider>
          <PaywallProvider>
            {children}
          </PaywallProvider>
        </GamificationProvider>
      </RewardNotificationProvider>
    </Suspense>
  );
}

/**
 * Feature providers for audio, notifications, and gamification
 * Order: Audio → Notifications → Announcements → [Deferred: Rewards → Gamification → Paywall]
 * 
 * Note: Heavy providers are deferred to improve TTI
 */
export const FeatureProviders = memo(function FeatureProviders({ children }: FeatureProvidersProps) {
  return (
    <GlobalAudioProvider>
      <NotificationProvider>
        <AnnouncementProvider>
          <DeferredProviders>
            {children}
          </DeferredProviders>
        </AnnouncementProvider>
      </NotificationProvider>
    </GlobalAudioProvider>
  );
});
