import { BOT_CONFIG } from '../config.ts';
import { checkIfNewUser, startOnboarding } from '../handlers/onboarding.ts';
import { handleDashboard } from '../handlers/dashboard.ts';
import { handleDeepLink } from '../handlers/deep-links.ts';

export async function handleStart(chatId: number, userId: number, startParam?: string) {
  // Handle deep links first
  if (startParam) {
    const result = await handleDeepLink(chatId, userId, startParam);
    if (result.handled) {
      return;
    }
  }
  
  // Check if user needs onboarding
  const isNewUser = await checkIfNewUser(userId);
  
  if (isNewUser) {
    // Start onboarding for new users
    await startOnboarding(chatId, userId);
  } else {
    // Show personalized dashboard for returning users
    await handleDashboard(chatId, userId);
  }
}
