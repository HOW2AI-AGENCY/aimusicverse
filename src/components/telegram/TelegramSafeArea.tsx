/* eslint-disable react-refresh/only-export-components */
/**
 * Telegram Safe Area Container
 * Feature: 032-professional-ui
 *
 * Wrapper component that handles Telegram Mini App safe areas
 */

import React, { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface TelegramSafeAreaProps {
  children: ReactNode;
  /** Include top safe area padding */
  top?: boolean;
  /** Include bottom safe area padding */
  bottom?: boolean;
  /** Additional padding beyond safe area */
  extraPadding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  className?: string;
  style?: CSSProperties;
}

/**
 * Calculates Telegram safe area CSS values
 */
export function getTelegramSafeAreaTop(): string {
  return "calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)))";
}

export function getTelegramSafeAreaBottom(): string {
  return "calc(max(var(--tg-content-safe-area-inset-bottom, 0px) + var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)))";
}

export function TelegramSafeArea({
  children,
  top = true,
  bottom = true,
  extraPadding,
  className,
  style,
}: TelegramSafeAreaProps) {
  const safeAreaStyle: CSSProperties = {
    ...style,
    paddingTop: top ? `calc(${getTelegramSafeAreaTop()} + ${extraPadding?.top || 0}px)` : extraPadding?.top,
    paddingBottom: bottom
      ? `calc(${getTelegramSafeAreaBottom()} + ${extraPadding?.bottom || 0}px)`
      : extraPadding?.bottom,
    paddingLeft: extraPadding?.left,
    paddingRight: extraPadding?.right,
  };

  return (
    <div className={className} style={safeAreaStyle}>
      {children}
    </div>
  );
}

/**
 * Telegram Content Area
 * Full-height container that accounts for safe areas and player bar
 */
interface TelegramContentAreaProps {
  children: ReactNode;
  /** Account for bottom player bar */
  hasPlayerBar?: boolean;
  /** Player bar height */
  playerBarHeight?: number;
  className?: string;
}

export function TelegramContentArea({
  children,
  hasPlayerBar = true,
  playerBarHeight = 72,
  className,
}: TelegramContentAreaProps) {
  return (
    <div
      className={cn("flex flex-col min-h-screen", className)}
      style={{
        paddingTop: getTelegramSafeAreaTop(),
        paddingBottom: hasPlayerBar
          ? `calc(${getTelegramSafeAreaBottom()} + ${playerBarHeight}px)`
          : getTelegramSafeAreaBottom(),
      }}
    >
      {children}
    </div>
  );
}

/**
 * Hook to get safe area values
 */
export function useTelegramSafeArea() {
  return {
    top: getTelegramSafeAreaTop(),
    bottom: getTelegramSafeAreaBottom(),
    cssVars: {
      "--safe-area-top": getTelegramSafeAreaTop(),
      "--safe-area-bottom": getTelegramSafeAreaBottom(),
    } as CSSProperties,
  };
}

export default TelegramSafeArea;
