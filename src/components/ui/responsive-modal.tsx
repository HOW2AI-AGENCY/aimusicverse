/**
 * ResponsiveModal - Unified modal component that adapts to viewport size
 * 
 * Features:
 * - Automatically uses MobileBottomSheet on mobile (<768px)
 * - Uses Dialog on desktop (>=768px)
 * - Consistent API across both implementations
 * - Swipe-to-dismiss on mobile
 * - Keyboard navigation support
 * - Accessible by default
 * 
 * Usage:
 *   <ResponsiveModal open={open} onOpenChange={setOpen}>
 *     <ResponsiveModalContent>
 *       <ResponsiveModalHeader>
 *         <ResponsiveModalTitle>Title</ResponsiveModalTitle>
 *       </ResponsiveModalHeader>
 *       Content here
 *     </ResponsiveModalContent>
 *   </ResponsiveModal>
 */

import * as React from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from './dialog';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /**
   * Snap points for mobile bottom sheet (percentages: [0.5, 0.9] = 50% and 90% height)
   * Default: [0.9] (90% of screen height)
   */
  snapPoints?: number[];
  /**
   * Default snap point index for mobile bottom sheet
   * Default: 0 (first snap point)
   */
  defaultSnapPoint?: number;
  /**
   * Whether to show drag handle on mobile bottom sheet
   * Default: true
   */
  showHandle?: boolean;
  /**
   * Force mobile or desktop mode regardless of viewport size
   * Useful for testing or special cases
   */
  forceMode?: 'mobile' | 'desktop';
}

export const ResponsiveModal = React.forwardRef<
  HTMLDivElement,
  ResponsiveModalProps
>(({
  open,
  onOpenChange,
  children,
  snapPoints = [0.9],
  defaultSnapPoint = 0,
  showHandle = true,
  forceMode,
}, ref) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const useMobileSheet = forceMode === 'mobile' || (forceMode !== 'desktop' && isMobile);

  if (useMobileSheet) {
    return (
      <MobileBottomSheet
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={snapPoints}
        defaultSnapPoint={defaultSnapPoint}
        showHandle={showHandle}
      >
        {children}
      </MobileBottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
});
ResponsiveModal.displayName = 'ResponsiveModal';

export interface ResponsiveModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Accessible title for screen readers when no visible title is present
   */
  accessibleTitle?: string;
  /**
   * If true, hides the title visually but keeps it for screen readers
   */
  hideTitle?: boolean;
  /**
   * If true, hides the default close button (desktop only)
   */
  hideCloseButton?: boolean;
  /**
   * Children content
   */
  children: React.ReactNode;
}

export const ResponsiveModalContent = React.forwardRef<
  HTMLDivElement,
  ResponsiveModalContentProps
>(({ 
  className, 
  children, 
  accessibleTitle = 'Диалоговое окно',
  hideTitle = false,
  hideCloseButton = false,
  ...props 
}, ref) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (isMobile) {
    // For mobile, content is rendered directly inside MobileBottomSheet
    return (
      <div 
        ref={ref} 
        className={cn('p-6', className)} 
        {...props}
      >
        {children}
      </div>
    );
  }

  // For desktop, use DialogContent
  return (
    <DialogContent
      ref={ref}
      className={className}
      hideTitle={hideTitle}
      accessibleTitle={accessibleTitle}
      {...props}
    >
      {!hideCloseButton && (
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Закрыть</span>
        </DialogClose>
      )}
      {children}
    </DialogContent>
  );
});
ResponsiveModalContent.displayName = 'ResponsiveModalContent';

export const ResponsiveModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5',
        isMobile ? 'text-center' : 'text-center sm:text-left',
        className
      )}
      {...props}
    />
  );
});
ResponsiveModalHeader.displayName = 'ResponsiveModalHeader';

export const ResponsiveModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (isMobile) {
    return (
      <h2
        ref={ref}
        className={cn(
          'text-lg font-semibold leading-none tracking-tight',
          className
        )}
        {...props}
      />
    );
  }

  return (
    <DialogTitle
      ref={ref}
      className={className}
      {...props}
    />
  );
});
ResponsiveModalTitle.displayName = 'ResponsiveModalTitle';

export const ResponsiveModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (isMobile) {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  }

  return (
    <DialogDescription
      ref={ref}
      className={className}
      {...props}
    />
  );
});
ResponsiveModalDescription.displayName = 'ResponsiveModalDescription';

export const ResponsiveModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div
      ref={ref}
      className={cn(
        'flex',
        isMobile 
          ? 'flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2' 
          : 'flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className
      )}
      {...props}
    />
  );
});
ResponsiveModalFooter.displayName = 'ResponsiveModalFooter';

export const ResponsiveModalClose = DialogClose;
