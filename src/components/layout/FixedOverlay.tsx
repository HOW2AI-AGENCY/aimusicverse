/**
 * FixedOverlay - Fixed position container with safe areas
 * For fullscreen overlays, modals, loading states
 * 
 * @example
 * ```tsx
 * <FixedOverlay center>
 *   <LoadingSpinner />
 * </FixedOverlay>
 * 
 * <FixedOverlay position="bottom">
 *   <FloatingControls />
 * </FixedOverlay>
 * ```
 */

import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { TELEGRAM_SAFE_AREA, getSafeAreaTop, getSafeAreaBottom } from '@/constants/safe-area';

type OverlayPosition = 'center' | 'top' | 'bottom' | 'fill';

interface FixedOverlayProps {
  children: ReactNode;
  /** Overlay position */
  position?: OverlayPosition;
  /** Center content (shorthand for position="center") */
  center?: boolean;
  /** Background style */
  background?: 'none' | 'blur' | 'dim' | 'solid';
  /** Z-index level */
  zIndex?: 'base' | 'dialog' | 'fullscreen' | 'critical';
  /** Additional className */
  className?: string;
  /** Style overrides */
  style?: CSSProperties;
  /** Click handler for backdrop */
  onClick?: () => void;
}

const zIndexMap = {
  base: 'z-40',
  dialog: 'z-80',
  fullscreen: 'z-90',
  critical: 'z-100',
};

const backgroundMap = {
  none: '',
  blur: 'bg-background/80 backdrop-blur-md',
  dim: 'bg-black/50',
  solid: 'bg-background',
};

/**
 * Fixed overlay with automatic safe area handling
 */
export function FixedOverlay({
  children,
  position = 'fill',
  center = false,
  background = 'none',
  zIndex = 'dialog',
  className,
  style,
  onClick,
}: FixedOverlayProps) {
  const actualPosition = center ? 'center' : position;

  const safeAreaStyle: CSSProperties = {
    paddingTop: getSafeAreaTop(0),
    paddingBottom: getSafeAreaBottom(0),
    ...style,
  };

  const positionClasses = {
    fill: 'inset-0',
    center: 'inset-0 flex items-center justify-center',
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0',
  };

  return (
    <div
      className={cn(
        'fixed',
        positionClasses[actualPosition],
        zIndexMap[zIndex],
        backgroundMap[background],
        className
      )}
      style={safeAreaStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * CenteredLoader - Centered loading indicator with safe areas
 */
interface CenteredLoaderProps {
  children: ReactNode;
  className?: string;
  /** Show backdrop */
  backdrop?: boolean;
}

export function CenteredLoader({
  children,
  className,
  backdrop = true,
}: CenteredLoaderProps) {
  return (
    <FixedOverlay
      center
      background={backdrop ? 'blur' : 'none'}
      zIndex="fullscreen"
      className={className}
    >
      {children}
    </FixedOverlay>
  );
}

/**
 * BottomSheet - Fixed bottom container with safe area
 */
interface BottomSheetContainerProps {
  children: ReactNode;
  className?: string;
  /** Account for bottom navigation */
  withBottomNav?: boolean;
  /** Extra bottom padding */
  extraBottom?: number;
}

export function BottomSheetContainer({
  children,
  className,
  withBottomNav = true,
  extraBottom = 0,
}: BottomSheetContainerProps) {
  const navHeight = withBottomNav ? 80 : 0;
  
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        className
      )}
      style={{
        paddingBottom: getSafeAreaBottom(navHeight + extraBottom),
      }}
    >
      {children}
    </div>
  );
}

export default FixedOverlay;
