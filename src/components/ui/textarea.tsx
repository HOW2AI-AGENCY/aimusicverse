import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Base styles
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2",
        // Typography - text-base on mobile prevents iOS zoom, md:text-sm on desktop
        "text-base md:text-sm leading-relaxed",
        // Text wrapping and overflow
        "whitespace-pre-wrap break-words overflow-wrap-anywhere",
        // Focus and states
        "ring-offset-background placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Touch optimization
        "touch-manipulation",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
