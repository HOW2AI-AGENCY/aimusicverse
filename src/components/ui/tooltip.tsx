import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      avoidCollisions
      collisionPadding={12}
      sticky="always"
      className={cn(
        // base: compact pill, aurora-tinted border, glassy surface
        "z-[9999] rounded-lg border border-border/60 bg-popover/95 backdrop-blur-xl backdrop-saturate-150",
        "px-2.5 py-1.5 text-[0.75rem] font-medium leading-tight tracking-tight text-popover-foreground",
        "shadow-[0_8px_24px_-10px_hsl(240_60%_2%/0.55),0_0_0_1px_hsl(var(--primary)/0.08)_inset]",
        "max-w-[min(260px,calc(100vw-1.5rem))]",
        // motion
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
