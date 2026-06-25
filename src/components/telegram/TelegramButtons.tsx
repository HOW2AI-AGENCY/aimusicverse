/**
 * Telegram Native Button Wrapper
 * Feature: 032-professional-ui
 *
 * Unified component for Telegram Main Button with UI fallback
 */

import React, { useEffect, ReactNode } from "react";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "@/lib/icons";
import { useTelegram } from "@/contexts/TelegramContext";
import { hapticPatterns } from "./TelegramHaptics";

interface TelegramMainButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  visible?: boolean;
  color?: string;
  textColor?: string;
  /** Fallback UI style */
  variant?: "primary" | "secondary" | "success" | "destructive";
  className?: string;
}

export function TelegramMainButton({
  text,
  onClick,
  disabled = false,
  loading = false,
  visible = true,
  color,
  textColor,
  variant = "primary",
  className,
}: TelegramMainButtonProps) {
  const { webApp, isInitialized } = useTelegram();
  const isTelegram = isInitialized && !!webApp;

  // Check if we should use native Telegram button
  const useNativeButton = isTelegram && webApp?.MainButton;

  useEffect(() => {
    if (!useNativeButton || !webApp?.MainButton) return;

    const mainButton = webApp.MainButton;

    // Configure button
    mainButton.setText(text);

    if (color) mainButton.setParams({ color });
    if (textColor) mainButton.setParams({ text_color: textColor });

    // Handle visibility
    if (visible && !disabled) {
      mainButton.show();
      mainButton.enable();
    } else if (!visible) {
      mainButton.hide();
    } else if (disabled) {
      mainButton.disable();
    }

    // Handle loading
    if (loading) {
      mainButton.showProgress();
    } else {
      mainButton.hideProgress();
    }

    // Click handler
    const handleClick = () => {
      if (!disabled && !loading) {
        hapticPatterns.primaryAction();
        onClick();
      }
    };

    mainButton.onClick(handleClick);

    return () => {
      mainButton.offClick(handleClick);
      mainButton.hide();
    };
  }, [useNativeButton, webApp, text, onClick, disabled, loading, visible, color, textColor]);

  // If using native button, don't render UI
  if (useNativeButton) {
    return null;
  }

  // Fallback UI button
  if (!visible) return null;

  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    success: "bg-success text-white hover:bg-success/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={() => {
        if (!disabled && !loading) {
          hapticPatterns.primaryAction();
          onClick();
        }
      }}
      disabled={disabled || loading}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "h-14 flex items-center justify-center gap-2",
        "font-semibold text-base",
        "transition-all duration-200",
        "safe-area-inset-bottom",
        variantStyles[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {text}
    </motion.button>
  );
}

/**
 * Telegram Secondary Button
 * For less prominent actions, always UI-based
 */
interface TelegramSecondaryButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  variant?: "outline" | "ghost" | "subtle";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TelegramSecondaryButton({
  text,
  onClick,
  disabled = false,
  loading = false,
  icon,
  variant = "outline",
  size = "md",
  className,
}: TelegramSecondaryButtonProps) {
  const variantStyles = {
    outline: "border border-border bg-transparent hover:bg-accent",
    ghost: "bg-transparent hover:bg-accent",
    subtle: "bg-muted hover:bg-muted/80",
  };

  const sizeStyles = {
    sm: "h-8 px-3 text-sm gap-1.5",
    md: "h-10 px-4 text-base gap-2",
    lg: "h-12 px-6 text-lg gap-2",
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={() => {
        if (!disabled && !loading) {
          hapticPatterns.secondaryAction();
          onClick();
        }
      }}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg",
        "font-medium transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {text}
    </motion.button>
  );
}

export default TelegramMainButton;
