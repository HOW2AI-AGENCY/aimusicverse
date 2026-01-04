/**
 * Centralized Telegram configuration for deep links and bot settings
 * 
 * Deep link format: https://t.me/BOT_USERNAME/APP_SHORT_NAME?startapp=PARAM
 * Example: https://t.me/AIMusicVerseBot/app?startapp=track_123
 * 
 * The start_param is passed to Mini App via webApp.initDataUnsafe.start_param
 */

export const getTelegramConfig = () => {
  const botUsername = Deno.env.get('TELEGRAM_BOT_USERNAME') || 'AIMusicVerseBot';
  const appShortName = Deno.env.get('TELEGRAM_APP_SHORT_NAME') || 'app';
  const miniAppUrl = Deno.env.get('MINI_APP_URL') || 'https://t.me/AIMusicVerseBot/app';
  
  return {
    botUsername,
    appShortName,
    miniAppUrl,
    // Base deep link URL (without ?startapp parameter)
    deepLinkBase: `https://t.me/${botUsername}/${appShortName}`,
  };
};

/**
 * Generate a deep link for a specific resource
 * @param type - Type of resource (track, project, generate, etc.)
 * @param id - Resource ID (optional)
 * @returns Full deep link URL
 */
export const generateDeepLink = (type: string, id?: string): string => {
  const config = getTelegramConfig();
  const param = id ? `${type}_${id}` : type;
  return `${config.deepLinkBase}?startapp=${param}`;
};

/**
 * Generate deep link for a track
 */
export const getTrackDeepLink = (trackId: string): string => {
  return generateDeepLink('track', trackId);
};

/**
 * Generate deep link for a project
 */
export const getProjectDeepLink = (projectId: string): string => {
  return generateDeepLink('project', projectId);
};

/**
 * Generate deep link for music generation with style
 */
export const getGenerateDeepLink = (style?: string): string => {
  return style ? generateDeepLink('generate', style) : generateDeepLink('generate');
};

/**
 * Generate deep link for quick generation preset
 */
export const getQuickGenDeepLink = (preset: string): string => {
  return generateDeepLink('quick', preset);
};

/**
 * Generate deep link for MusicLab tools
 */
export const getMusicLabDeepLink = (tool?: 'drums' | 'dj' | 'guitar' | 'melody'): string => {
  return tool ? generateDeepLink(tool) : generateDeepLink('musiclab');
};

/**
 * Generate deep link for user profile
 */
export const getProfileDeepLink = (userId: string): string => {
  return generateDeepLink('profile', userId);
};

/**
 * Generate referral invite link
 */
export const getInviteDeepLink = (userId: string): string => {
  return generateDeepLink('invite', userId);
};

/**
 * Generate payment deep link
 */
export const getPaymentDeepLink = (type: 'buy' | 'credits' | 'subscribe' = 'buy'): string => {
  return generateDeepLink(type);
};
