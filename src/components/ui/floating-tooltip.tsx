import * as React from "react";
import { cn } from "@/lib/utils";
import { X, Lightbulb, Info, Sparkles } from "lucide-react";
import { Button } from "./button";

interface FloatingTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tooltip content */
  content: string;
  /** Optional title */
  title?: string;
  /** Icon type */
  icon?: "tip" | "info" | "sparkle";
  /** Position relative to parent */
  position?: "top" | "bottom" | "left" | "right";
  /** Whether tooltip can be dismissed */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Show arrow */
  showArrow?: boolean;
  /** Auto-hide delay in ms (0 = don't auto-hide) */
  autoHideDelay?: number;
}

const iconComponents = {
  tip: Lightbulb,
  info: Info,
  sparkle: Sparkles,
};

const positionStyles = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowStyles = {
  top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45",
  bottom: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45",
  left: "right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45",
  right: "left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-45",
};

export const FloatingTooltip = React.forwardRef<HTMLDivElement, FloatingTooltipProps>(
  (
    {
      className,
      content,
      title,
      icon = "tip",
      position = "top",
      dismissible = true,
      onDismiss,
      showArrow = true,
      autoHideDelay = 0,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const Icon = iconComponents[icon];

    React.useEffect(() => {
      if (autoHideDelay > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onDismiss?.();
        }, autoHideDelay);
        return () => clearTimeout(timer);
      }
    }, [autoHideDelay, onDismiss]);

    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 max-w-xs animate-in fade-in-0 zoom-in-95 duration-200",
          positionStyles[position],
          className
        )}
        {...props}
      >
        {/* Arrow */}
        {showArrow && (
          <div
            className={cn(
              "absolute w-2 h-2 bg-popover border border-border",
              arrowStyles[position]
            )}
          />
        )}

        {/* Content */}
        <div className="relative bg-popover border border-border rounded-xl shadow-lg p-3">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <p className="text-sm font-medium text-foreground mb-0.5">
                  {title}
                </p>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {content}
              </p>
            </div>
            {dismissible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 -mr-1 -mt-1"
                onClick={handleDismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

FloatingTooltip.displayName = "FloatingTooltip";

// Contextual hint component
interface ContextualHintProps {
  /** Unique ID for localStorage persistence */
  hintId: string;
  /** Hint content */
  content: string;
  /** Optional title */
  title?: string;
  /** Icon type */
  icon?: "tip" | "info" | "sparkle";
  /** Position */
  position?: "top" | "bottom" | "left" | "right";
  /** Show only once */
  showOnce?: boolean;
  /** Delay before showing (ms) */
  showDelay?: number;
  children: React.ReactNode;
}

export const ContextualHint: React.FC<ContextualHintProps> = ({
  hintId,
  content,
  title,
  icon = "tip",
  position = "bottom",
  showOnce = true,
  showDelay = 500,
  children,
}) => {
  const [showHint, setShowHint] = React.useState(false);
  const storageKey = `hint-dismissed-${hintId}`;

  React.useEffect(() => {
    if (showOnce) {
      const dismissed = localStorage.getItem(storageKey);
      if (dismissed) return;
    }

    const timer = setTimeout(() => {
      setShowHint(true);
    }, showDelay);

    return () => clearTimeout(timer);
  }, [showOnce, showDelay, storageKey]);

  const handleDismiss = () => {
    setShowHint(false);
    if (showOnce) {
      localStorage.setItem(storageKey, "true");
    }
  };

  return (
    <div className="relative inline-block">
      {children}
      {showHint && (
        <FloatingTooltip
          content={content}
          title={title}
          icon={icon}
          position={position}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
};
