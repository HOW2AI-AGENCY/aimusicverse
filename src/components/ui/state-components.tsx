import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button or component */
  action?: React.ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: {
    container: "py-6 px-4",
    icon: "w-10 h-10 mb-3",
    title: "text-sm font-medium",
    description: "text-xs",
  },
  md: {
    container: "py-10 px-6",
    icon: "w-14 h-14 mb-4",
    title: "text-base font-semibold",
    description: "text-sm",
  },
  lg: {
    container: "py-16 px-8",
    icon: "w-20 h-20 mb-6",
    title: "text-lg font-semibold",
    description: "text-base",
  },
};

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { className, icon, title, description, action, size = "md", ...props },
    ref
  ) => {
    const styles = sizeStyles[size];

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          "animate-in fade-in-50 duration-300",
          styles.container,
          className
        )}
        {...props}
      >
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-full",
              "bg-muted/50 text-muted-foreground",
              styles.icon
            )}
          >
            {icon}
          </div>
        )}
        <h3 className={cn("text-foreground", styles.title)}>{title}</h3>
        {description && (
          <p
            className={cn(
              "mt-1.5 text-muted-foreground max-w-sm",
              styles.description
            )}
          >
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

// Loading state component
interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Loading message */
  message?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show spinner */
  showSpinner?: boolean;
}

export const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  (
    { className, message, size = "md", showSpinner = true, ...props },
    ref
  ) => {
    const styles = sizeStyles[size];

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          styles.container,
          className
        )}
        {...props}
      >
        {showSpinner && (
          <div className={cn("relative", styles.icon)}>
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-muted" />
            {/* Spinning gradient ring */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            {/* Inner pulse */}
            <div className="absolute inset-2 rounded-full bg-primary/10 animate-pulse" />
          </div>
        )}
        {message && (
          <p className={cn("text-muted-foreground mt-2", styles.description)}>
            {message}
          </p>
        )}
      </div>
    );
  }
);

LoadingState.displayName = "LoadingState";

// Error state component
interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Error icon */
  icon?: React.ReactNode;
  /** Error title */
  title?: string;
  /** Error message */
  message?: string;
  /** Retry action */
  onRetry?: () => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      className,
      icon,
      title = "Что-то пошло не так",
      message,
      onRetry,
      size = "md",
      ...props
    },
    ref
  ) => {
    return (
      <EmptyState
        ref={ref}
        icon={icon}
        title={title}
        description={message}
        size={size}
        action={
          onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-primary hover:underline"
            >
              Попробовать снова
            </button>
          )
        }
        className={className}
        {...props}
      />
    );
  }
);

ErrorState.displayName = "ErrorState";
