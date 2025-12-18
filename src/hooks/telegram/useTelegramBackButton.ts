import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';

interface BackButtonConfig {
  /** Custom onClick handler. If not provided, navigates back */
  onClick?: () => void;
  /** Whether the back button should be visible */
  visible?: boolean;
  /** Custom navigation path instead of history.back() */
  fallbackPath?: string;
}

interface BackButtonReturn {
  /** True if running in real Telegram Mini App */
  isRealMiniApp: boolean;
  /** True if UI fallback button should be shown */
  shouldShowUIButton: boolean;
}

/**
 * Hook for managing Telegram BackButton with automatic navigation handling.
 * 
 * - Real Mini App users: Shows native Telegram BackButton
 * - Test users / web browser: Returns flag to show UI back button
 * 
 * @example
 * ```tsx
 * const { shouldShowUIButton } = useTelegramBackButton({
 *   visible: true,
 *   fallbackPath: '/projects',
 * });
 * 
 * return (
 *   <>
 *     {shouldShowUIButton && (
 *       <Button onClick={() => navigate(-1)}>Back</Button>
 *     )}
 *   </>
 * );
 * ```
 */
export function useTelegramBackButton({
  onClick,
  visible = true,
  fallbackPath,
}: BackButtonConfig = {}): BackButtonReturn {
  const { platform, isDevelopmentMode, showBackButton, hideBackButton, hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  
  // Store callback in ref to avoid re-subscriptions
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  
  const fallbackPathRef = useRef(fallbackPath);
  fallbackPathRef.current = fallbackPath;
  
  // Determine environment
  const isRealMiniApp = Boolean(platform && platform !== 'web' && platform !== '' && !isDevelopmentMode);
  const shouldShowUIButton = !isRealMiniApp;
  
  // Default handler with haptic feedback
  const handleClick = useCallback(() => {
    hapticFeedback('light');
    
    if (onClickRef.current) {
      onClickRef.current();
    } else if (fallbackPathRef.current) {
      navigate(fallbackPathRef.current);
    } else {
      navigate(-1);
    }
  }, [hapticFeedback, navigate]);
  
  useEffect(() => {
    // Only manage BackButton in real Mini App environment
    if (!isRealMiniApp || !visible) {
      hideBackButton();
      return;
    }
    
    showBackButton(handleClick);
    
    return () => {
      hideBackButton();
    };
  }, [isRealMiniApp, visible, handleClick, showBackButton, hideBackButton]);
  
  return {
    isRealMiniApp,
    shouldShowUIButton,
  };
}
