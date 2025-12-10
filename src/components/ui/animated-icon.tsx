import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, type Easing } from '@/lib/motion';
import { LucideIcon } from "lucide-react";

interface AnimatedIconProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  animation?: "bounce" | "pulse" | "spin" | "shake" | "none";
  color?: "default" | "primary" | "generate" | "success" | "muted";
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

const colorClasses = {
  default: "text-foreground",
  primary: "text-primary",
  generate: "text-generate",
  success: "text-success",
  muted: "text-muted-foreground",
};

const getAnimation = (animation: string) => {
  switch (animation) {
    case "bounce":
      return { y: [0, -4, 0] };
    case "pulse":
      return { scale: [1, 1.1, 1] };
    case "spin":
      return { rotate: 360 };
    case "shake":
      return { x: [0, -2, 2, -2, 2, 0] };
    default:
      return {};
  }
};

const getTransition = (animation: string) => {
  switch (animation) {
    case "bounce":
      return { duration: 0.5, repeat: Infinity, repeatDelay: 2 };
    case "pulse":
      return { duration: 0.8, repeat: Infinity };
    case "spin":
      return { duration: 2, repeat: Infinity, ease: "linear" as const };
    case "shake":
      return { duration: 0.4, repeat: Infinity, repeatDelay: 3 };
    default:
      return {};
  }
};

export function AnimatedIcon({
  icon: Icon,
  size = "md",
  animation = "none",
  color = "default",
  className,
  onClick,
}: AnimatedIconProps) {
  return (
    <motion.div
      className={cn(
        "inline-flex items-center justify-center",
        onClick && "cursor-pointer"
      )}
      whileHover={onClick ? { scale: 1.1 } : undefined}
      whileTap={onClick ? { scale: 0.9 } : undefined}
      onClick={onClick}
      animate={getAnimation(animation)}
      transition={getTransition(animation)}
    >
      <Icon className={cn(sizeClasses[size], colorClasses[color], className)} />
    </motion.div>
  );
}
