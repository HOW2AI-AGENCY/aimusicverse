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
  
  // Show dashboard for all users (onboarding removed)
  await handleDashboard(chatId, userId);
}
