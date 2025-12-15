import * as React from "react";
import { cn } from "@/lib/utils";

interface PulseIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Indicator variant */
  variant?: "default" | "success" | "warning" | "destructive" | "primary";
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Whether the indicator should pulse */
  pulse?: boolean;
}

const variantColors = {
  default: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  primary: "bg-primary",
};

const sizeStyles = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export const PulseIndicator = React.forwardRef<HTMLDivElement, PulseIndicatorProps>(
  ({ className, variant = "default", size = "md", pulse = true, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("relative inline-flex", className)}
        {...props}
      >
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              variantColors[variant]
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full",
            variantColors[variant],
            sizeStyles[size]
          )}
        />
      </span>
    );
  }
);

PulseIndicator.displayName = "PulseIndicator";

// Status indicator with label
interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "online" | "offline" | "busy" | "away" | "pending";
  label?: string;
  showLabel?: boolean;
}

const statusConfig = {
  online: { variant: "success" as const, label: "Online" },
  offline: { variant: "default" as const, label: "Offline" },
  busy: { variant: "destructive" as const, label: "Busy" },
  away: { variant: "warning" as const, label: "Away" },
  pending: { variant: "primary" as const, label: "Pending" },
};

export const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, label, showLabel = false, ...props }, ref) => {
    const config = statusConfig[status];
    const displayLabel = label || config.label;

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-2", className)}
        {...props}
      >
        <PulseIndicator
          variant={config.variant}
          size="sm"
          pulse={status === "online" || status === "pending"}
        />
        {showLabel && (
          <span className="text-xs text-muted-foreground">{displayLabel}</span>
        )}
      </div>
    );
  }
);

StatusIndicator.displayName = "StatusIndicator";
