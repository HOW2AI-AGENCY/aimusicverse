import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation variant */
  variant?: "fade" | "slide-up" | "slide-down" | "scale" | "blur";
  /** Delay in ms */
  delay?: number;
  /** Duration in ms */
  duration?: number;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Stagger children animations */
  stagger?: boolean;
  /** Stagger delay between children */
  staggerDelay?: number;
}

const variantStyles = {
  fade: {
    initial: "opacity-0",
    animate: "opacity-100",
  },
  "slide-up": {
    initial: "opacity-0 translate-y-4",
    animate: "opacity-100 translate-y-0",
  },
  "slide-down": {
    initial: "opacity-0 -translate-y-4",
    animate: "opacity-100 translate-y-0",
  },
  scale: {
    initial: "opacity-0 scale-95",
    animate: "opacity-100 scale-100",
  },
  blur: {
    initial: "opacity-0 blur-sm",
    animate: "opacity-100 blur-0",
  },
};

export const AnimatedContainer = React.forwardRef<HTMLDivElement, AnimatedContainerProps>(
  (
    {
      className,
      variant = "fade",
      delay = 0,
      duration = 300,
      animate = true,
      stagger = false,
      staggerDelay = 50,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(!animate);

    React.useEffect(() => {
      if (animate) {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
      }
    }, [animate, delay]);

    const styles = variantStyles[variant];

    if (stagger && React.Children.count(children) > 0) {
      return (
        <div ref={ref} className={className} {...props}>
          {React.Children.map(children, (child, index) => (
            <div
              className={cn(
                "transition-all",
                isVisible ? styles.animate : styles.initial
              )}
              style={{
                transitionDuration: `${duration}ms`,
                transitionDelay: `${delay + index * staggerDelay}ms`,
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {child}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "transition-all",
          isVisible ? styles.animate : styles.initial,
          className
        )}
        style={{
          transitionDuration: `${duration}ms`,
          transitionDelay: `${delay}ms`,
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AnimatedContainer.displayName = "AnimatedContainer";

// Staggered list animation wrapper
interface StaggeredListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Base delay before first item */
  baseDelay?: number;
  /** Delay between each item */
  staggerDelay?: number;
  /** Animation duration per item */
  duration?: number;
}

export const StaggeredList = React.forwardRef<HTMLDivElement, StaggeredListProps>(
  ({ className, baseDelay = 0, staggerDelay = 50, duration = 300, children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {React.Children.map(children, (child, index) => (
          <AnimatedContainer
            variant="slide-up"
            delay={baseDelay + index * staggerDelay}
            duration={duration}
          >
            {child}
          </AnimatedContainer>
        ))}
      </div>
    );
  }
);

StaggeredList.displayName = "StaggeredList";
