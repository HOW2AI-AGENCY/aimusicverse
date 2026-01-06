/**
 * @deprecated Use Button component with variant="glow" or variant="generate" instead
 * This component is kept for backwards compatibility only
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glowButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 overflow-hidden active:scale-[0.98] hover:scale-[1.02]",
  {
    variants: {
      variant: {
        generate: "bg-gradient-generate text-white shadow-glow-generate hover:shadow-glow-lg",
        primary: "bg-gradient-telegram text-white shadow-glow hover:shadow-glow-lg",
        success: "bg-gradient-success text-white shadow-[0_0_30px_0_hsl(var(--success)/0.4)]",
        outline: "border-2 border-primary/50 bg-transparent text-foreground hover:bg-primary/10 hover:border-primary",
        ghost: "bg-transparent text-foreground hover:bg-muted",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-base",
        xl: "h-16 px-10 py-5 text-lg",
        icon: "h-12 w-12",
      },
      glow: {
        none: "",
        pulse: "animate-pulse-glow",
        static: "",
      }
    },
    defaultVariants: {
      variant: "generate",
      size: "default",
      glow: "none",
    },
  }
);

export interface GlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glowButtonVariants> {}

const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant, size, glow, children, ...props }, ref) => {
    return (
      <button
        className={cn(glowButtonVariants({ variant, size, glow, className }))}
        ref={ref}
        {...props}
      >
        {/* Glow effect layer */}
        {glow === "static" && (
          <span 
            className="absolute inset-0 -z-10 blur-xl opacity-50"
            style={{ 
              background: variant === "generate" 
                ? "hsl(var(--generate-glow))" 
                : variant === "success"
                ? "hsl(var(--success-glow))"
                : "hsl(var(--primary))"
            }}
          />
        )}
        
        {/* Shimmer effect */}
        <span className="absolute inset-0 -z-10 overflow-hidden rounded-inherit">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
        </span>
        
        {children}
      </button>
    );
  }
);
GlowButton.displayName = "GlowButton";

export { GlowButton, glowButtonVariants };
