import * as React from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface RippleButtonProps extends ButtonProps {
  /** Ripple color - defaults to white with opacity */
  rippleColor?: string;
  /** Ripple duration in ms */
  rippleDuration?: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ className, rippleColor = "rgba(255, 255, 255, 0.35)", rippleDuration = 600, children, onClick, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const newRipple: Ripple = {
        id: Date.now(),
        x,
        y,
        size,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, rippleDuration);

      onClick?.(e);
    };

    // Merge refs
    React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

    return (
      <Button
        ref={buttonRef}
        className={cn("relative overflow-hidden", className)}
        onClick={handleClick}
        {...props}
      >
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              background: rippleColor,
              transform: "scale(0)",
              animation: `ripple ${rippleDuration}ms ease-out forwards`,
            }}
          />
        ))}
        {children}
      </Button>
    );
  }
);

RippleButton.displayName = "RippleButton";
