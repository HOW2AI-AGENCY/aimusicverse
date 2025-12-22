import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';

interface SecondaryButtonConfig {
  text: string;
  onClick: () => void;
  enabled?: boolean;
  visible?: boolean;
  color?: string;
  textColor?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

interface SecondaryButtonReturn {
  /** True if running in real Telegram Mini App with SecondaryButton support */
  isSupported: boolean;
  /** True if UI fallback button should be shown (dev mode or no support) */
  shouldShowUIButton: boolean;
  /** Show progress spinner on SecondaryButton */
  showProgress: (leaveActive?: boolean) => void;
  /** Hide progress spinner on SecondaryButton */
  hideProgress: () => void;
  /** Enable the SecondaryButton */
  enable: () => void;
  /** Disable the SecondaryButton */
  disable: () => void;
}

/**
 * Hook for managing Telegram SecondaryButton (Mini App 2.0+) with fallback to UI button.
 * 
 * SecondaryButton provides a second action button alongside MainButton, allowing:
 * - Two-action workflows (e.g., "Save" + "Generate")
 * - Alternative actions (e.g., "Share" + "Add to Playlist")
 * - Cancel/Confirm patterns
 * 
 * - Real Mini App users (iOS/Android/Desktop with 2.0+): Shows native Telegram SecondaryButton
 * - Test users (dev mode / web browser / old Telegram): Shows standard UI Button component
 * 
 * @example
 * ```tsx
 * const { shouldShowUIButton } = useTelegramSecondaryButton({
 *   text: 'Сохранить черновик',
 *   onClick: handleSaveDraft,
 *   enabled: hasUnsavedChanges,
 *   visible: sheetOpen,
 *   position: 'left', // Position relative to MainButton
 * });
 * 
 * return (
 *   <>
 *     {shouldShowUIButton && (
 *       <Button variant="outline" onClick={handleSaveDraft}>
 *         Сохранить черновик
 *       </Button>
 *     )}
 *   </>
 * );
 * ```
 */
export function useTelegramSecondaryButton({
  text,
  onClick,
  enabled = true,
  visible = true,
  color,
  textColor,
  position = 'left',
}: SecondaryButtonConfig): SecondaryButtonReturn {
  const { platform, isDevelopmentMode, showSecondaryButton, hideSecondaryButton, webApp } = useTelegram();
  
  // Store callback in ref to avoid re-subscriptions
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  
  // Check if SecondaryButton API is available (Mini App 2.0+)
  const hasSecondaryButtonAPI = !!(
    webApp?.SecondaryButton && 
    typeof webApp.SecondaryButton.show === 'function' &&
    typeof webApp.SecondaryButton.hide === 'function' &&
    typeof webApp.SecondaryButton.setText === 'function'
  );
  
  // Check if SecondaryButton is actually visible
  const secondaryButtonVisible = webApp?.SecondaryButton ? (webApp.SecondaryButton as { isVisible?: boolean }).isVisible === true : false;
  
  // Determine if SecondaryButton is supported
  const isNativePlatform = platform === 'ios' || platform === 'android' || platform === 'tdesktop';
  const isSupported = Boolean(
    hasSecondaryButtonAPI && 
    platform && 
    platform !== 'web' && 
    platform !== '' &&
    (isNativePlatform || !isDevelopmentMode)
  );
  
  // Show UI button as fallback if SecondaryButton is not supported or not rendering
  const shouldShowUIButton = !isSupported || (isSupported && visible && !secondaryButtonVisible);
  
  // Stable callback wrapper
  const handleClick = useCallback(() => {
    onClickRef.current();
  }, []);
  
  useEffect(() => {
    // Only manage SecondaryButton if supported and visible
    if (!isSupported || !visible) {
      hideSecondaryButton();
      return;
    }
    
    showSecondaryButton(text, handleClick, {
      color,
      textColor,
      position,
    });
    
    // Set active state (if API supports it)
    if (webApp?.SecondaryButton) {
      const btn = webApp.SecondaryButton as { 
        setActive?: (active: boolean) => void;
        enable?: () => void;
        disable?: () => void;
      };
      if (typeof btn.setActive === 'function') {
        btn.setActive(enabled);
      }
      if (enabled && typeof btn.enable === 'function') {
        btn.enable();
      } else if (!enabled && typeof btn.disable === 'function') {
        btn.disable();
      }
    }
    
    return () => {
      hideSecondaryButton();
    };
  }, [isSupported, text, handleClick, enabled, visible, color, textColor, position, showSecondaryButton, hideSecondaryButton, webApp]);
  
  // Progress control methods (if supported)
  const showProgress = useCallback((leaveActive: boolean = false) => {
    const btn = webApp?.SecondaryButton as { showProgress?: (leaveActive: boolean) => void } | undefined;
    if (btn?.showProgress) {
      btn.showProgress(leaveActive);
    }
  }, [webApp]);
  
  const hideProgress = useCallback(() => {
    const btn = webApp?.SecondaryButton as { hideProgress?: () => void } | undefined;
    if (btn?.hideProgress) {
      btn.hideProgress();
    }
  }, [webApp]);
  
  const enable = useCallback(() => {
    const btn = webApp?.SecondaryButton as { enable?: () => void } | undefined;
    if (btn?.enable) {
      btn.enable();
    }
  }, [webApp]);
  
  const disable = useCallback(() => {
    const btn = webApp?.SecondaryButton as { disable?: () => void } | undefined;
    if (btn?.disable) {
      btn.disable();
    }
  }, [webApp]);
  
  return {
    isSupported,
    shouldShowUIButton,
    showProgress,
    hideProgress,
    enable,
    disable,
  };
}
