import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';

interface MainButtonConfig {
  text: string;
  onClick: () => void;
  enabled?: boolean;
  visible?: boolean;
  color?: string;
  textColor?: string;
}

interface MainButtonReturn {
  /** True if running in real Telegram Mini App (not web preview) */
  isRealMiniApp: boolean;
  /** True if UI fallback button should be shown (dev mode or web) */
  shouldShowUIButton: boolean;
  /** Show progress spinner on MainButton */
  showProgress: (leaveActive?: boolean) => void;
  /** Hide progress spinner on MainButton */
  hideProgress: () => void;
  /** Enable the MainButton */
  enable: () => void;
  /** Disable the MainButton */
  disable: () => void;
}

/**
 * Hook for managing Telegram MainButton with fallback to UI button for test users.
 * 
 * - Real Mini App users (iOS/Android/Desktop): Shows native Telegram MainButton
 * - Test users (dev mode / web browser): Shows standard UI Button component
 * 
 * @example
 * ```tsx
 * const { shouldShowUIButton, showProgress, hideProgress } = useTelegramMainButton({
 *   text: loading ? 'Создание...' : 'СГЕНЕРИРОВАТЬ',
 *   onClick: handleGenerate,
 *   enabled: !loading,
 *   visible: sheetOpen,
 * });
 * 
 * return (
 *   <>
 *     {shouldShowUIButton && (
 *       <Button onClick={handleGenerate} disabled={loading}>
 *         Сгенерировать
 *       </Button>
 *     )}
 *   </>
 * );
 * ```
 */
export function useTelegramMainButton({
  text,
  onClick,
  enabled = true,
  visible = true,
  color,
  textColor,
}: MainButtonConfig): MainButtonReturn {
  const { platform, isDevelopmentMode, showMainButton, hideMainButton, webApp } = useTelegram();
  
  // Store callback in ref to avoid re-subscriptions
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  
  // Check if MainButton API is actually available and functional
  const hasMainButtonAPI = !!(
    webApp?.MainButton && 
    typeof webApp.MainButton.show === 'function' &&
    typeof webApp.MainButton.hide === 'function' &&
    typeof webApp.MainButton.setText === 'function'
  );
  
  // Determine environment - real Mini App if platform is mobile AND MainButton API exists
  // IMPORTANT: On iOS/Android, even in dev mode, we should use native MainButton if available
  const isNativePlatform = platform === 'ios' || platform === 'android' || platform === 'tdesktop';
  const isRealMiniApp = Boolean(
    hasMainButtonAPI && 
    platform && 
    platform !== 'web' && 
    platform !== '' &&
    (isNativePlatform || !isDevelopmentMode) // Allow native button on iOS/Android even in dev mode
  );
  const shouldShowUIButton = !isRealMiniApp;
  
  // Stable callback wrapper
  const handleClick = useCallback(() => {
    onClickRef.current();
  }, []);
  
  useEffect(() => {
    // Only manage MainButton in real Mini App environment
    if (!isRealMiniApp || !visible) {
      hideMainButton();
      return;
    }
    
    showMainButton(text, handleClick, {
      color,
      textColor,
      isActive: enabled,
      isVisible: visible,
    });
    
    return () => {
      hideMainButton();
    };
  }, [isRealMiniApp, text, handleClick, enabled, visible, color, textColor, showMainButton, hideMainButton]);
  
  // Progress control methods
  const showProgress = useCallback((leaveActive: boolean = false) => {
    if (webApp?.MainButton?.showProgress) {
      webApp.MainButton.showProgress(leaveActive);
    }
  }, [webApp]);
  
  const hideProgress = useCallback(() => {
    if (webApp?.MainButton?.hideProgress) {
      webApp.MainButton.hideProgress();
    }
  }, [webApp]);
  
  const enable = useCallback(() => {
    if (webApp?.MainButton?.enable) {
      webApp.MainButton.enable();
    }
  }, [webApp]);
  
  const disable = useCallback(() => {
    if (webApp?.MainButton?.disable) {
      webApp.MainButton.disable();
    }
  }, [webApp]);
  
  return {
    isRealMiniApp,
    shouldShowUIButton,
    showProgress,
    hideProgress,
    enable,
    disable,
  };
}
