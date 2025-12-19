import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';

interface SettingsButtonConfig {
  /** Custom onClick handler. If not provided, navigates to /settings */
  onClick?: () => void;
  /** Whether the settings button should be visible. Default: true on main pages */
  visible?: boolean;
}

interface SettingsButtonReturn {
  /** True if running in real Telegram Mini App */
  isRealMiniApp: boolean;
  /** True if Settings Button is available */
  isAvailable: boolean;
}

/**
 * Hook for managing Telegram SettingsButton.
 * Shows a native settings button in the Telegram header.
 * 
 * @example
 * ```tsx
 * // Auto-navigate to settings
 * useTelegramSettingsButton({ visible: true });
 * 
 * // Custom handler
 * useTelegramSettingsButton({ 
 *   visible: true,
 *   onClick: () => setShowSettingsSheet(true)
 * });
 * ```
 */
export function useTelegramSettingsButton({
  onClick,
  visible = true,
}: SettingsButtonConfig = {}): SettingsButtonReturn {
  const { webApp, platform, isDevelopmentMode, showSettingsButton, hideSettingsButton, hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Store callback in ref to avoid re-subscriptions
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  
  // Determine environment
  const isRealMiniApp = Boolean(platform && platform !== 'web' && platform !== '' && !isDevelopmentMode);
  const isAvailable = Boolean(webApp?.SettingsButton);
  
  // Default handler navigates to settings
  const handleClick = useCallback(() => {
    hapticFeedback('light');
    
    if (onClickRef.current) {
      onClickRef.current();
    } else {
      // Navigate to settings if not already there
      if (location.pathname !== '/settings') {
        navigate('/settings');
      }
    }
  }, [hapticFeedback, navigate, location.pathname]);
  
  useEffect(() => {
    // Only manage SettingsButton in real Mini App environment
    if (!isRealMiniApp || !visible || !isAvailable) {
      hideSettingsButton();
      return;
    }
    
    showSettingsButton(handleClick);
    
    return () => {
      hideSettingsButton();
    };
  }, [isRealMiniApp, visible, isAvailable, handleClick, showSettingsButton, hideSettingsButton]);
  
  return {
    isRealMiniApp,
    isAvailable,
  };
}
