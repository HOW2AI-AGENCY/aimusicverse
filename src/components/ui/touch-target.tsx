/**
 * Touch Target Wrapper Component
 * Feature: 032-professional-ui
 *
 * Ensures interactive elements meet minimum touch target size requirements (44px).
 * Wraps small buttons, icons, and links to make them mobile-friendly.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type TouchSize = 44 | 48;

export interface TouchTargetProps {
  minSize?: TouchSize;
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

/**
 * TouchTarget Component
 *
 * Wraps interactive elements to ensure they meet minimum touch target size.
 * Adds invisible padding around small elements while preserving layout.
 *
 * Usage:
 *   <TouchTarget>
 *     <button onClick={action}>
 *       <Icon name="heart" size={16} />
 *     </button>
 *   </TouchTarget>
 *
 *   <TouchTarget minSize={48}>
 *     <a href="/link">Small link</a>
 *   </TouchTarget>
 */
export const TouchTarget: React.FC<TouchTargetProps> = ({
  minSize = 44,
  className,
  children,
  as: Component = 'div',
}) => {
  const sizeStyles = {
    44: 'min-w-[44px] min-h-[44px]',
    48: 'min-w-[48px] min-h-[48px]',
  };

  return (
    <Component
      className={cn(
        'inline-flex items-center justify-center',
        sizeStyles[minSize],
        className
      )}
    >
      {children}
    </Component>
  );
};

/**
 * TouchableIcon Component
 *
 * Combines icon with proper touch target sizing.
 *
 * Usage:
 *   <TouchableIcon icon={<Icon />} onClick={handleClick} />
 */
export interface TouchableIconProps {
  icon: React.ReactNode;
  onClick?: () => void;
  minSize?: TouchSize;
  className?: string;
  ariaLabel?: string;
}

export const TouchableIcon: React.FC<TouchableIconProps> = ({
  icon,
  onClick,
  minSize = 44,
  className,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center rounded-md',
        'transition-colors duration-150',
        'hover:bg-muted active:bg-muted-foreground/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        minSize === 44 && 'min-w-[44px] min-h-[44px]',
        minSize === 48 && 'min-w-[48px] min-h-[48px]',
        className
      )}
    >
      {icon}
    </button>
  );
};

/**
 * TouchableLink Component
 *
 * Combines link with proper touch target sizing.
 *
 * Usage:
 *   <TouchableLink href="/path" icon={<Icon />}>Label</TouchableLink>
 */
export interface TouchableLinkProps {
  href: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  minSize?: TouchSize;
  className?: string;
}

export const TouchableLink: React.FC<TouchableLinkProps> = ({
  href,
  icon,
  children,
  minSize = 44,
  className,
}) => {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'transition-colors duration-150',
        'hover:text-primary active:text-primary/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md',
        minSize === 44 && 'min-h-[44px] px-3',
        minSize === 48 && 'min-h-[48px] px-4',
        className
      )}
    >
      {icon}
      {children}
    </a>
  );
};

export default {
  TouchTarget,
  TouchableIcon,
  TouchableLink,
};
