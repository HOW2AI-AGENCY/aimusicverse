/**
 * Common hooks barrel file
 * 
 * Centralized exports for frequently used hooks.
 * Import from here to keep imports clean.
 * 
 * @example
 * import { useAuth, useIsMobile, usePlayerStore } from '@/hooks/common';
 */

// Authentication
export { useAuth } from './useAuth';

// Mobile detection
export { useIsMobile } from './use-mobile';

// Player state
export { usePlayerStore } from './audio/usePlayerState';

// Telegram integration
export { useTelegramIntegration } from './useTelegramIntegration';

// Offline status
export { useOfflineStatus } from './useOfflineStatus';

// Track utilities
export { useTrackEnhancedData, useSingleTrackEnhancedData } from './useTrackEnhancedData';

// Credits
export { useCredits } from './useCredits';
