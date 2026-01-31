/**
 * FeatureProviders - Consolidated feature-related providers
 * 
 * Combines providers for app features:
 * - GlobalAudio (audio playback)
 * - Notifications (realtime updates)
 * - Announcements (system messages)
 * - Gamification + Rewards (achievements, rewards - already coupled)
 * - Paywall (subscription triggers)
 */

import { ReactNode, memo } from 'react';
import { GlobalAudioProvider } from '@/components/GlobalAudioProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AnnouncementProvider } from '@/contexts/AnnouncementContext';
import { RewardNotificationProvider } from '@/contexts/RewardNotificationContext';
import { GamificationProvider } from '@/contexts/GamificationContext';
import { PaywallProvider } from '@/components/premium/PaywallProvider';

interface FeatureProvidersProps {
  children: ReactNode;
}

/**
 * Feature providers for audio, notifications, and gamification
 * Order: Audio → Notifications → Announcements → Rewards → Gamification → Paywall
 * 
 * Note: GamificationProvider depends on RewardNotificationProvider
 * Note: PaywallProvider needs auth context from CoreProviders
 */
export const FeatureProviders = memo(function FeatureProviders({ children }: FeatureProvidersProps) {
  return (
    <GlobalAudioProvider>
      <NotificationProvider>
        <AnnouncementProvider>
          <RewardNotificationProvider>
            <GamificationProvider>
              <PaywallProvider>
                {children}
              </PaywallProvider>
            </GamificationProvider>
          </RewardNotificationProvider>
        </AnnouncementProvider>
      </NotificationProvider>
    </GlobalAudioProvider>
  );
});
