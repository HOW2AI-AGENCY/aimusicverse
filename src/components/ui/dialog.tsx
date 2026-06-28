import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@/lib/icons";
import { useGesture } from "@use-gesture/react";

import { cn } from "@/lib/utils";
import { backdrop } from "@/lib/overlay-colors";
import { VisuallyHidden } from "./visually-hidden";
import { hapticImpact } from "@/lib/haptic";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[160] bg-background/40 backdrop-blur-md backdrop-saturate-150",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "supports-[backdrop-filter]:bg-background/30",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;


interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** If true, a visually hidden title will be automatically added for accessibility */
  hideTitle?: boolean;
  /** Accessible title for screen readers when no visible DialogTitle is present */
  accessibleTitle?: string;
  /**
   * If true, render as a native bottom-sheet on mobile (<640px) — slide-up from bottom,
   * full width, drag-handle, safe-area-bottom padding, swipe-to-dismiss.
   *
   * Enabled by default: renders as native bottom-sheet on mobile (<640px).
   * Set mobileSheet={false} to force centered modal on all viewports.
   */
  mobileSheet?: boolean;
}

/**
 * Hook: swipe-down to dismiss for mobileSheet.
 * Accessibility safeguards:
 *  - Only activates on real touch input (pointerType === 'touch') — keyboard users never trigger.
 *  - Disabled when user prefers reduced motion (no transform animations applied).
 *  - Disabled on viewports ≥640px (sheet is a centered modal there).
 *  - Ignored when gesture starts on an interactive element or while scrolling inside content.
 */
function useSwipeDownToClose(
  enabled: boolean,
  contentRef: React.RefObject<HTMLDivElement | null>,
  closeRef: React.RefObject<HTMLButtonElement | null>,
) {
  const nodeRef = contentRef;

  const bind = useGesture(
    {
      onDrag: ({ movement: [mx, my], velocity: [vx, vy], last, first, tap, event }) => {
        if (!enabled) return;

        const node = nodeRef.current;
        if (!node) return;

        // Check viewport and preferences
        const isMobile = window.matchMedia("(max-width: 639.98px)").matches;
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!isMobile || prefersReducedMotion) return;

        // Check if touch input
        const pointerEvent = event as PointerEvent;
        if (pointerEvent.pointerType !== "touch") return;

        // Skip if content is scrollable
        if (node.scrollTop > 0 || node.scrollHeight > node.clientHeight + 10) return;

        // Skip if target is interactive
        const target = pointerEvent.target as HTMLElement | null;
        if (target?.closest(
          "input, textarea, select, button, a[href], [contenteditable='true'], " +
          "[role='button'], [role='slider'], [role='switch'], [tabindex]:not([tabindex='-1']), " +
          "[data-no-swipe], [data-no-swipe-area]"
        )) return;

        // Handle drag start
        if (first) {
          node.style.transition = "none";
        }

        // Track movement (only positive Y for swipe down)
        const delta = Math.max(0, my);
        if (delta > 0) {
          node.style.transform = `translate3d(0, ${delta}px, 0)`;
        }

        // Handle drag end
        if (last) {
          const shouldClose = delta > 96 || (vy > 0.6 && delta > 20);
          if (shouldClose) {
            hapticImpact("light");
            closeRef.current?.click();
          }

          // Animate back or away
          node.style.transition = "transform 200ms cubic-bezier(0.32, 0.72, 0, 1)";
          node.style.transform = "";
        }
      },
    },
    {
      drag: {
        filterTaps: true,
        threshold: 5,
        from: () => [0, 0], // Start from current position
        rubberband: false,
      },
    },
  );

  // Only bind when enabled
  React.useEffect(() => {
    if (!enabled || !nodeRef.current) return;
    bind(nodeRef.current);
  }, [enabled, bind, nodeRef]);

}

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  ({ className, children, hideTitle = false, accessibleTitle = "Диалоговое окно", mobileSheet = true, ...props }, ref) => {
    // Check if this is a fullscreen dialog (has h-[100dvh], h-screen, or h-[100vh] in className)
    const isFullscreen =
      className?.includes("h-[100dvh]") || className?.includes("h-screen") || className?.includes("h-[100vh]");

    const innerRef = React.useRef<HTMLDivElement | null>(null);
    const closeRef = React.useRef<HTMLButtonElement | null>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);
    useSwipeDownToClose(mobileSheet, innerRef, closeRef);

    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={innerRef}
          className={cn(
            // Default: centered modal at all viewport sizes (preserves existing dialog geometry)
            "fixed left-[50%] top-[50%] z-[161] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border/50 bg-background p-6 shadow-2xl duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "sm:rounded-xl",
            // Opt-in: native bottom-sheet on mobile only
            mobileSheet && [
              "max-sm:left-0 max-sm:top-auto max-sm:bottom-0 max-sm:translate-x-0 max-sm:translate-y-0",
              "max-sm:max-w-none max-sm:w-full max-sm:max-h-[92dvh] max-sm:overflow-y-auto",
              "max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:px-5 max-sm:pt-6 max-sm:pb-[max(env(safe-area-inset-bottom),1rem)]",
              "max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom",
              "max-sm:touch-pan-y max-sm:overscroll-contain",
              "max-sm:before:content-[''] max-sm:before:absolute max-sm:before:top-2 max-sm:before:left-1/2 max-sm:before:-translate-x-1/2 max-sm:before:h-1 max-sm:before:w-10 max-sm:before:rounded-full max-sm:before:bg-muted-foreground/30",
            ],
            className,
          )}
          style={
            isFullscreen
              ? {
                  paddingTop:
                    "max(calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px)), calc(env(safe-area-inset-top, 0px) + 0.5rem))",
                }
              : undefined
          }
          {...props}
        >
          {hideTitle && (
            <VisuallyHidden asChild>
              <DialogPrimitive.Title>{accessibleTitle}</DialogPrimitive.Title>
            </VisuallyHidden>
          )}
          {children}
          <DialogPrimitive.Close
            ref={closeRef}
            aria-label="Закрыть"
            className="absolute right-2 top-3 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-accent active:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none touch-manipulation"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Закрыть</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;



const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
