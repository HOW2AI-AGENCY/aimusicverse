/**
 * Touch Target Wrapper Component
 * Feature: 032-professional-ui
 *
 * Ensures interactive elements meet minimum touch target size requirements (44px).
 * Wraps small buttons, icons, and links to make them mobile-friendly.
 *
 * @see src/lib/touch-target.ts for utility classes
 * @see src/lib/design-tokens.ts for touchTargetClass tokens
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";
import { touchTargetClass } from "@/lib/design-tokens";

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
  as: Component = "div",
}) => {
  const sizeStyles = {
    44: "min-w-[44px] min-h-[44px]",
    48: "min-w-[48px] min-h-[48px]",
  };

  return (
    <Component className={cn("inline-flex items-center justify-center", sizeStyles[minSize], className)}>
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
  disabled?: boolean;
}

export const TouchableIcon: React.FC<TouchableIconProps> = ({
  icon,
  onClick,
  minSize = 44,
  className,
  ariaLabel,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        "transition-colors duration-150",
        "hover:bg-muted active:bg-muted-foreground/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-50 disabled:pointer-events-none",
        minSize === 44 && "min-w-[44px] min-h-[44px]",
        minSize === 48 && "min-w-[48px] min-h-[48px]",
        className,
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

export const TouchableLink: React.FC<TouchableLinkProps> = ({ href, icon, children, minSize = 44, className }) => {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "transition-colors duration-150",
        "hover:text-primary active:text-primary/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md",
        minSize === 44 && "min-h-[44px] px-3",
        minSize === 48 && "min-h-[48px] px-4",
        className,
      )}
    >
      {icon}
      {children}
    </a>
  );
};

// ============================================================================
// IconButton with Touch Target
// ============================================================================

interface IconButtonProps extends Omit<ButtonProps, "size"> {
  /** Icon element */
  icon: React.ReactNode;
  /** Visual size (touch area is always 44px minimum) */
  visualSize?: "xs" | "sm" | "md" | "lg";
  /** Label for accessibility */
  "aria-label": string;
}

/**
 * Icon button with guaranteed 44x44px touch target
 * Visual size can be smaller but touch area is always 44px
 */
export function IconButton({ icon, visualSize = "md", className, variant = "ghost", ...props }: IconButtonProps) {
  // Map visual size to icon container size
  const iconSizes = {
    xs: "[&>svg]:w-3.5 [&>svg]:h-3.5",
    sm: "[&>svg]:w-4 [&>svg]:h-4",
    md: "[&>svg]:w-5 [&>svg]:h-5",
    lg: "[&>svg]:w-6 [&>svg]:h-6",
  };

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn(touchTargetClass.icon, iconSizes[visualSize], className)}
      {...props}
    >
      {icon}
    </Button>
  );
}

// ============================================================================
// CompactIconButton - Visually smaller but with expanded touch area
// ============================================================================

interface CompactIconButtonProps extends Omit<ButtonProps, "size"> {
  /** Icon element */
  icon: React.ReactNode;
  /** Label for accessibility */
  "aria-label": string;
}

/**
 * Visually compact icon button with expanded touch target
 * Uses invisible pseudo-element to expand touch area
 */
export function CompactIconButton({ icon, className, variant = "ghost", ...props }: CompactIconButtonProps) {
  return (
    <Button
      variant={variant}
      size="icon"
      className={cn(
        // Visual size is small
        "h-8 w-8",
        // Ensure touch area is at least 44px with pseudo-element
        'relative before:absolute before:-inset-2 before:content-[""]',
        "[&>svg]:w-4 [&>svg]:h-4",
        className,
      )}
      {...props}
    >
      {icon}
    </Button>
  );
}

// ============================================================================
// CloseButton - Standard X button with touch target
// ============================================================================

interface CloseButtonProps extends Omit<ButtonProps, "children" | "size"> {
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Standard close button (X) with proper touch target
 */
export function CloseButton({ size = "md", className, variant = "ghost", ...props }: CloseButtonProps) {
  const sizeClasses = {
    sm: "h-8 w-8 min-h-[44px] min-w-[44px]",
    md: touchTargetClass.icon,
    lg: "h-12 w-12 min-h-[48px] min-w-[48px]",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Button
      variant={variant}
      size="icon"
      aria-label="Закрыть"
      className={cn(sizeClasses[size], "text-muted-foreground hover:text-foreground", className)}
      {...props}
    >
      <span className="sr-only">Закрыть</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconSizes[size]}
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </Button>
  );
}

// ============================================================================
// TouchableListItem - List item with proper touch target
// ============================================================================

interface TouchableListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether item is interactive */
  interactive?: boolean;
  /** Whether item is currently active/selected */
  active?: boolean;
  /** Whether to show pressed state feedback */
  pressable?: boolean;
}

/**
 * List item with guaranteed 48px touch target height
 */
export function TouchableListItem({
  children,
  className,
  interactive = true,
  active = false,
  pressable = true,
  ...props
}: TouchableListItemProps) {
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        touchTargetClass.listItem,
        "flex items-center gap-3 px-3",
        interactive && "cursor-pointer",
        interactive &&
          "hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        pressable && "active:bg-accent active:scale-[0.99] transition-all duration-100",
        active && "bg-accent",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Re-export utility classes and functions
// ============================================================================

export { touchTargetClass } from "@/lib/design-tokens";
export {
  touchTarget,
  TOUCH_CLASSES,
  TOUCH_TARGET_MIN_SIZE,
  validateTouchTarget,
  getTouchTargetPadding,
} from "@/lib/touch-target";

export default {
  TouchTarget,
  TouchableIcon,
  TouchableLink,
  IconButton,
  CompactIconButton,
  CloseButton,
  TouchableListItem,
};
