import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Copy, ChevronRight, ExternalLink } from "lucide-react";

// Interactive icon that responds to click
interface InteractiveIconProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export const InteractiveIcon = React.forwardRef<HTMLButtonElement, InteractiveIconProps>(
  ({ className, icon, activeIcon, isActive = false, size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "relative inline-flex items-center justify-center rounded-full",
          "transition-all duration-200 ease-out",
          "hover:bg-accent active:scale-90",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "transition-all duration-200",
            isActive ? "scale-0 opacity-0" : "scale-100 opacity-100"
          )}
        >
          {icon}
        </span>
        {activeIcon && (
          <span
            className={cn(
              "absolute transition-all duration-200",
              isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
          >
            {activeIcon}
          </span>
        )}
      </button>
    );
  }
);

InteractiveIcon.displayName = "InteractiveIcon";

// Copy button with feedback
interface CopyButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  textToCopy: string;
  size?: "sm" | "md" | "lg";
}

export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ className, textToCopy, size = "md", ...props }, ref) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };

    return (
      <InteractiveIcon
        ref={ref}
        icon={<Copy className="h-4 w-4" />}
        activeIcon={<Check className="h-4 w-4 text-success" />}
        isActive={copied}
        size={size}
        onClick={handleCopy}
        className={className}
        {...props}
      />
    );
  }
);

CopyButton.displayName = "CopyButton";

// Expandable chevron
interface ExpandChevronProps extends React.HTMLAttributes<HTMLSpanElement> {
  isExpanded: boolean;
  size?: "sm" | "md" | "lg";
}

const chevronSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export const ExpandChevron: React.FC<ExpandChevronProps> = ({
  isExpanded,
  size = "md",
  className,
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center transition-transform duration-200",
        isExpanded && "rotate-90",
        className
      )}
      {...props}
    >
      <ChevronRight className={chevronSizes[size]} />
    </span>
  );
};

// External link icon with animation
interface ExternalLinkIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
}

export const ExternalLinkIcon: React.FC<ExternalLinkIconProps> = ({
  size = "sm",
  className,
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      <ExternalLink className={chevronSizes[size]} />
    </span>
  );
};

// Hover card with lift effect
interface HoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverContent?: React.ReactNode;
  disabled?: boolean;
}

export const HoverCard = React.forwardRef<HTMLDivElement, HoverCardProps>(
  ({ className, children, hoverContent, disabled = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative group",
          !disabled && [
            "transition-all duration-200 ease-out",
            "hover:-translate-y-1",
            "hover:shadow-lg hover:shadow-primary/5",
          ],
          className
        )}
        {...props}
      >
        {children}
        {hoverContent && (
          <div
            className={cn(
              "absolute inset-0 opacity-0 transition-opacity duration-200",
              "group-hover:opacity-100 pointer-events-none"
            )}
          >
            {hoverContent}
          </div>
        )}
      </div>
    );
  }
);

HoverCard.displayName = "HoverCard";
