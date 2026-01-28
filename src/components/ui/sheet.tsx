import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "@/lib/icons";
import * as React from "react";

import { cn } from "@/lib/utils";
import { VisuallyHidden } from "./visually-hidden";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-sheet-backdrop bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-sheet-content gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  /** If true, a visually hidden title will be automatically added for accessibility */
  hideTitle?: boolean;
  /** Accessible title for screen readers when no visible SheetTitle is present */
  accessibleTitle?: string;
  /** If true, hides the default close button */
  hideCloseButton?: boolean;
}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = "right", className, children, hideTitle = false, accessibleTitle = "Боковая панель", hideCloseButton = false, ...props }, ref) => {
    // Check if this is a fullscreen sheet (has h-full, h-screen, or h-[100dvh] in className)
    const isFullscreen = className?.includes('h-full') || className?.includes('h-screen') || className?.includes('h-[100dvh]') || className?.includes('h-[100vh]');
    
    return (
      <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content 
          ref={ref} 
          className={cn(sheetVariants({ side }), className)} 
          style={isFullscreen ? {
            // Apply safe area padding for fullscreen sheets based on side
            paddingTop: side === 'top' 
              ? 'max(calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px)), calc(env(safe-area-inset-top, 0px) + 0.5rem))'
              : undefined,
            paddingBottom: side === 'bottom' 
              ? 'max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))'
              : undefined,
            paddingLeft: side === 'left'
              ? 'max(var(--tg-safe-area-inset-left, 0px), env(safe-area-inset-left, 0px))'
              : undefined,
            paddingRight: side === 'right'
              ? 'max(var(--tg-safe-area-inset-right, 0px), env(safe-area-inset-right, 0px))'
              : undefined,
          } : undefined}
          {...props}
        >
          {/* Accessible title for screen readers when no visible title exists */}
          {hideTitle && (
            <VisuallyHidden asChild>
              <SheetPrimitive.Title>{accessibleTitle}</SheetPrimitive.Title>
            </VisuallyHidden>
          )}
          {children}
          {!hideCloseButton && (
            <SheetPrimitive.Close className="absolute right-2 top-3 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-accent active:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none touch-manipulation">
              <X className="h-5 w-5" />
              <span className="sr-only">Закрыть</span>
            </SheetPrimitive.Close>
          )}
        </SheetPrimitive.Content>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
