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
import { Dialog } from '@/components/dialog/variants/modal';
import { Sheet } from '@/components/dialog/variants/sheet';

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
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children}
      </Sheet>
    );
  }

  // On desktop, use Dialog (modal)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

export default MobileDialogOrSheet;
