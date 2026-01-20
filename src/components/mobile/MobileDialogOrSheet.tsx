/**
 * MobileDialogOrSheet - Adaptive dialog component
 * Uses Sheet on mobile devices, Dialog on desktop
 *
 * @example
 * ```tsx
 * <MobileDialogOrSheet open={open} onOpenChange={setOpen}>
 *   <DialogContent>Content</DialogContent>
 * </MobileDialogOrSheet>
 * ```
 */

import { useIsMobile } from '@/hooks/use-mobile';
import { ModalDialog } from '@/components/dialog/variants/modal';
import { SheetDialog } from '@/components/dialog/variants/sheet';

interface MobileDialogOrSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /**
   * Force mobile (Sheet) or desktop (Dialog) mode
   * @default undefined - auto-detect based on screen size
   */
  isMobile?: boolean;
}

/**
 * DialogContent wrapper that works with both Dialog and Sheet
 */
export const DialogContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

/**
 * Adaptive dialog component that automatically switches between:
 * - Sheet (bottom sheet) on mobile devices
 * - Modal dialog on desktop
 */
export function MobileDialogOrSheet({
  open,
  onOpenChange,
  children,
  isMobile: forceMobile,
}: MobileDialogOrSheetProps) {
  const isMobileDevice = useIsMobile();
  const useMobile = forceMobile !== undefined ? forceMobile : isMobileDevice;

  // On mobile, use Sheet (bottom sheet)
  if (useMobile) {
    return (
      <SheetDialog open={open} onOpenChange={onOpenChange} title="" variant="sheet">
        {children}
      </SheetDialog>
    );
  }

  // On desktop, use Dialog (modal)
  return (
    <ModalDialog open={open} onOpenChange={onOpenChange} title="" variant="modal">
      {children}
    </ModalDialog>
  );
}

export default MobileDialogOrSheet;
