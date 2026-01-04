import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from '@/lib/motion';

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: "default" | "elevated" | "subtle";
  hover?: "lift" | "glow" | "scale" | "none";
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const variantClasses = {
  default: "glass-card",
  elevated: "glass-card shadow-lg",
  subtle: "bg-muted/30 backdrop-blur-sm border border-border/50",
};

const hoverClasses = {
  lift: "hover:-translate-y-1 hover:shadow-lg",
  glow: "card-glow",
  scale: "hover:scale-[1.02]",
  none: "",
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ 
    className, 
    variant = "default", 
    hover = "lift", 
    padding = "md",
    children,
    ...props 
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-2xl overflow-hidden transition-all duration-300",
          variantClasses[variant],
          hoverClasses[hover],
          paddingClasses[padding],
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
