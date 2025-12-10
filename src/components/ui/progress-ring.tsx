import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from '@/lib/motion';

interface ProgressRingProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg";
  strokeWidth?: number;
  showValue?: boolean;
  label?: string;
  color?: "primary" | "generate" | "success" | "warning" | "gradient";
  className?: string;
  children?: React.ReactNode;
}

const sizeMap = {
  sm: 40,
  md: 64,
  lg: 96,
};

const strokeWidthMap = {
  sm: 4,
  md: 6,
  lg: 8,
};

export function ProgressRing({
  value,
  size = "md",
  strokeWidth,
  showValue = false,
  label,
  color = "primary",
  className,
  children,
}: ProgressRingProps) {
  const dimension = sizeMap[size];
  const stroke = strokeWidth || strokeWidthMap[size];
  const radius = (dimension - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const colorClasses = {
    primary: "stroke-primary",
    generate: "stroke-generate",
    success: "stroke-success",
    warning: "stroke-warning",
    gradient: "",
  };

  const gradientId = React.useId();

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={dimension}
        height={dimension}
        className="transform -rotate-90"
      >
        {color === "gradient" && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--generate))" />
            </linearGradient>
          </defs>
        )}
        
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          className="opacity-30"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={color === "gradient" ? `url(#${gradientId})` : undefined}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(color !== "gradient" && colorClasses[color])}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          <>
            {showValue && (
              <span className={cn(
                "font-bold tabular-nums",
                size === "sm" && "text-xs",
                size === "md" && "text-sm",
                size === "lg" && "text-lg"
              )}>
                {Math.round(value)}%
              </span>
            )}
            {label && (
              <span className={cn(
                "text-muted-foreground",
                size === "sm" && "text-[8px]",
                size === "md" && "text-[10px]",
                size === "lg" && "text-xs"
              )}>
                {label}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
