/**
 * UnifiedDialog Unit Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedDialog } from '@/components/dialog';

describe('UnifiedDialog', () => {
  describe('Modal Variant', () => {
    it('should render modal dialog when open', () => {
      render(
        <UnifiedDialog
          variant="modal"
          open={true}
          onOpenChange={() => {}}
          title="Test Modal"
        >
          <p>Modal content</p>
        </UnifiedDialog>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(
        <UnifiedDialog
          variant="modal"
          open={false}
          onOpenChange={() => {}}
          title="Test Modal"
        >
          <p>Modal content</p>
        </UnifiedDialog>
      );

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('should close on backdrop click when closeOnOverlayClick is true', async () => {
      let open = true;
      const handleClose = jest.fn(() => { open = false; });

      const { rerender } = render(
        <UnifiedDialog
          variant="modal"
          open={open}
          onOpenChange={handleClose}
          title="Test Modal"
          closeOnOverlayClick={true}
        >
          <p>Modal content</p>
        </UnifiedDialog>
      );

      // Click backdrop
      const backdrop = document.querySelector('.fixed.inset-0.z-50');
      fireEvent.click(backdrop!);

      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });

  describe('Sheet Variant', () => {
    it('should render sheet dialog when open', () => {
      render(
        <UnifiedDialog
          variant="sheet"
          open={true}
          onOpenChange={() => {}}
          title="Test Sheet"
        >
          <p>Sheet content</p>
        </UnifiedDialog>
      );

      expect(screen.getByText('Test Sheet')).toBeInTheDocument();
      expect(screen.getByText('Sheet content')).toBeInTheDocument();
    });
  });

  describe('Alert Variant', () => {
    it('should render alert dialog with confirm and cancel buttons', () => {
      const handleConfirm = jest.fn();

      render(
        <UnifiedDialog
          variant="alert"
          open={true}
          onOpenChange={() => {}}
          title="Delete?"
          description="This cannot be undone"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleConfirm}
        />
      );

      expect(screen.getByText('Delete?')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', async () => {
      const handleConfirm = jest.fn();

      render(
        <UnifiedDialog
          variant="alert"
          open={true}
          onOpenChange={() => {}}
          title="Delete?"
          description="This cannot be undone"
          confirmLabel="Delete"
          onConfirm={handleConfirm}
        />
      );

      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(handleConfirm).toHaveBeenCalled();
      });
    });
  });

  describe('Variant Routing', () => {
    it('should route to correct variant based on variant prop', () => {
      const { rerender } = render(
        <UnifiedDialog
          variant="modal"
          open={true}
          onOpenChange={() => {}}
          title="Test"
        >
          Content
        </UnifiedDialog>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();

      // Rerender with sheet variant
      rerender(
        <UnifiedDialog
          variant="sheet"
          open={true}
          onOpenChange={() => {}}
          title="Test"
        >
          Content
        </UnifiedDialog>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
