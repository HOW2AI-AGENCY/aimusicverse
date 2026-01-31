/**
 * Notification Badge Component
 * Feature: 032-professional-ui
 * 
 * Animated count badges with various styles
 */

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count?: number;
  maxCount?: number;
  dot?: boolean;
  showZero?: boolean;
  children?: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'destructive' | 'success' | 'warning';
  pulse?: boolean;
  className?: string;
  badgeClassName?: string;
}

export function NotificationBadge({
  count = 0,
  maxCount = 99,
  dot = false,
  showZero = false,
  children,
  position = 'top-right',
  size = 'md',
  variant = 'default',
  pulse = false,
  className,
  badgeClassName,
}: NotificationBadgeProps) {
  const showBadge = dot || count > 0 || (showZero && count === 0);
  const displayCount = count > maxCount ? `${maxCount}+` : count;

  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  };

  const sizeClasses = {
    sm: dot ? 'w-2 h-2' : 'min-w-[16px] h-4 text-[10px] px-1',
    md: dot ? 'w-2.5 h-2.5' : 'min-w-[20px] h-5 text-xs px-1.5',
    lg: dot ? 'w-3 h-3' : 'min-w-[24px] h-6 text-sm px-2',
  };

  const variantClasses = {
    default: 'bg-foreground text-background',
    primary: 'bg-primary text-primary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      {children}
      
      <AnimatePresence>
        {showBadge && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 500, 
              damping: 25 
            }}
            className={cn(
              "absolute flex items-center justify-center",
              "rounded-full font-medium",
              positionClasses[position],
              sizeClasses[size],
              variantClasses[variant],
              badgeClassName
            )}
          >
            {/* Pulse animation */}
            {pulse && (
              <span className={cn(
                "absolute inset-0 rounded-full animate-ping",
                variantClasses[variant],
                "opacity-75"
              )} />
            )}
            
            {/* Content */}
            {!dot && (
              <motion.span
                key={count}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10"
              >
                {displayCount}
              </motion.span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Status Indicator Component
 * Small colored dot for online/offline status
 */
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  size = 'md',
  pulse = true,
  className,
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const statusColors = {
    online: 'bg-success',
    offline: 'bg-muted-foreground',
    away: 'bg-warning',
    busy: 'bg-destructive',
  };

  return (
    <span
      className={cn(
        "relative inline-block rounded-full",
        "ring-2 ring-background",
        sizeClasses[size],
        statusColors[status],
        className
      )}
    >
      {pulse && status === 'online' && (
        <span className={cn(
          "absolute inset-0 rounded-full animate-ping",
          statusColors[status],
          "opacity-75"
        )} />
      )}
    </span>
  );
}

/**
 * Label Badge Component
 * Text-based badge for labels/tags
 */
interface LabelBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'primary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function LabelBadge({
  children,
  variant = 'default',
  size = 'md',
  removable,
  onRemove,
  className,
}: LabelBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-2.5 py-1.5 gap-2',
  };

  const variantClasses = {
    default: 'bg-muted text-muted-foreground',
    outline: 'border border-border text-foreground bg-transparent',
    secondary: 'bg-secondary text-secondary-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <motion.span
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
      
      {removable && (
        <button
          onClick={onRemove}
          className={cn(
            "ml-0.5 rounded-full p-0.5",
            "hover:bg-foreground/10 transition-colors",
            "focus:outline-none focus:ring-1 focus:ring-primary"
          )}
        >
          <svg 
            className="w-3 h-3" 
            viewBox="0 0 12 12" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      )}
    </motion.span>
  );
}

export default NotificationBadge;
