/**
 * Enhanced Tooltip Component
 * Feature: 032-professional-ui
 *
 * Polished tooltips with animations and variants
 */

import React, { ReactNode, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";

type TooltipPosition = "top" | "bottom" | "left" | "right";
type TooltipVariant = "default" | "dark" | "light" | "primary";

interface EnhancedTooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  delay?: number;
  disabled?: boolean;
  arrow?: boolean;
  maxWidth?: number;
  className?: string;
}

const positionStyles: Record<
  TooltipPosition,
  {
    container: string;
    arrow: string;
    initial: { x?: number; y?: number };
  }
> = {
  top: {
    container: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    arrow: "top-full left-1/2 -translate-x-1/2 border-t-current border-x-transparent border-b-transparent",
    initial: { y: 4 },
  },
  bottom: {
    container: "top-full left-1/2 -translate-x-1/2 mt-2",
    arrow: "bottom-full left-1/2 -translate-x-1/2 border-b-current border-x-transparent border-t-transparent",
    initial: { y: -4 },
  },
  left: {
    container: "right-full top-1/2 -translate-y-1/2 mr-2",
    arrow: "left-full top-1/2 -translate-y-1/2 border-l-current border-y-transparent border-r-transparent",
    initial: { x: 4 },
  },
  right: {
    container: "left-full top-1/2 -translate-y-1/2 ml-2",
    arrow: "right-full top-1/2 -translate-y-1/2 border-r-current border-y-transparent border-l-transparent",
    initial: { x: -4 },
  },
};

const variantStyles: Record<TooltipVariant, string> = {
  default: "bg-popover text-popover-foreground border border-border shadow-lg",
  dark: "bg-foreground text-background shadow-lg",
  light: "bg-background text-foreground border border-border shadow-lg",
  primary: "bg-primary text-primary-foreground shadow-lg",
};

export function EnhancedTooltip({
  children,
  content,
  position = "top",
  variant = "dark",
  delay = 300,
  disabled = false,
  arrow = true,
  maxWidth = 200,
  className,
}: EnhancedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const positionConfig = positionStyles[position];

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, ...positionConfig.initial }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...positionConfig.initial }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn("absolute z-50 pointer-events-none", positionConfig.container)}
            style={{ maxWidth }}
          >
            <div
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-sm",
                "whitespace-normal break-words",
                variantStyles[variant],
                className,
              )}
            >
              {content}

              {/* Arrow */}
              {arrow && (
                <div
                  className={cn(
                    "absolute w-0 h-0",
                    "border-4",
                    positionConfig.arrow,
                    variant === "dark" && "text-foreground",
                    variant === "default" && "text-popover",
                    variant === "light" && "text-background",
                    variant === "primary" && "text-primary",
                  )}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Keyboard Shortcut Display
 */
interface ShortcutProps {
  keys: string[];
  className?: string;
}

export function Shortcut({ keys, className }: ShortcutProps) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          <kbd
            className={cn(
              "inline-flex items-center justify-center",
              "min-w-[20px] h-5 px-1.5",
              "text-[10px] font-medium uppercase",
              "bg-muted border border-border rounded",
              "text-muted-foreground",
            )}
          >
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="text-muted-foreground text-xs">+</span>}
        </React.Fragment>
      ))}
    </span>
  );
}

/**
 * Tooltip with Shortcut
 */
interface TooltipWithShortcutProps extends Omit<EnhancedTooltipProps, "content"> {
  label: string;
  shortcut?: string[];
}

export function TooltipWithShortcut({ label, shortcut, children, ...props }: TooltipWithShortcutProps) {
  return (
    <EnhancedTooltip
      content={
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && <Shortcut keys={shortcut} />}
        </div>
      }
      {...props}
    >
      {children}
    </EnhancedTooltip>
  );
}

export default EnhancedTooltip;
