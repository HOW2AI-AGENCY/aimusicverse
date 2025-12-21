import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Determine proper inputMode for better iOS keyboard
    const getInputMode = () => {
      if (type === 'number') return 'decimal';
      if (type === 'tel') return 'tel';
      if (type === 'email') return 'email';
      if (type === 'url') return 'url';
      return undefined;
    };

    return (
      <input
        type={type}
        inputMode={getInputMode()}
        className={cn(
          // Base styles with minimum 44px touch target for iOS
          "flex min-h-[44px] h-10 w-full rounded-md border border-input bg-background px-3 py-2",
          // Typography - text-base (16px) prevents iOS Safari zoom on focus
          "text-base md:text-sm",
          // File input styling
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // States
          "ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Touch optimization - prevents double-tap zoom and improves touch response
          "touch-manipulation",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
