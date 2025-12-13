import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 btn-enhanced",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-sm shadow-primary/20",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 shadow-sm shadow-destructive/20",
        outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/40 active:bg-accent/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline",
        // Enhanced variants with better visual feedback
        glow: "bg-gradient-to-br from-primary via-primary to-generate text-white shadow-lg shadow-primary/40 hover:shadow-xl hover:shadow-primary/50 hover:scale-[1.02]",
        generate: "bg-gradient-to-br from-generate via-generate/90 to-primary text-white shadow-lg shadow-generate/40 hover:shadow-xl hover:shadow-generate/50 hover:scale-[1.02]",
        success: "bg-gradient-to-br from-success to-success/90 text-white hover:from-success/90 hover:to-success/80 shadow-sm shadow-success/20",
        glass: "bg-background/60 backdrop-blur-md border border-border/60 hover:bg-background/80 hover:border-primary/40 shadow-sm",
      },
      size: {
        default: "h-11 px-5 py-2", // 44px - meets touch target
        sm: "h-10 rounded-lg px-3.5", // 40px - acceptable for non-primary actions
        lg: "h-12 rounded-xl px-8", // 48px - comfortable
        xl: "h-14 rounded-2xl px-10 text-base", // 56px - very comfortable
        icon: "h-11 w-11", // 44px - meets touch target for icons
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
