/**
 * UnifiedDialog Unit Tests
 */

import React, { Suspense } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { UnifiedDialog } from '@/components/dialog';

function renderWithSuspense(ui: React.ReactElement) {
  return render(<Suspense fallback={<div>Loading...</div>}>{ui}</Suspense>);
}

describe('UnifiedDialog', () => {
  describe('Modal Variant', () => {
    it('should render modal dialog when open', async () => {
      renderWithSuspense(
        <UnifiedDialog
          variant="modal"
          open={true}
          onOpenChange={() => {}}
          title="Test Modal"
        >
          <p>Modal content</p>
        </UnifiedDialog>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Modal')).toBeInTheDocument();
      });
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      renderWithSuspense(
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

    it.skip('should close on backdrop click when closeOnOverlayClick is true', async () => {
      let open = true;
      const handleClose = vi.fn(() => { open = false; });

      const { rerender } = renderWithSuspense(
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

      await waitFor(() => {
        expect(screen.getByText('Test Modal')).toBeInTheDocument();
      });

      // Click overlay/backdrop
      const backdrop = document.querySelector('[data-radix-portal]')?.querySelector('[role="dialog"]')?.parentElement
        || document.querySelector('[data-state="open"]');
      if (backdrop) fireEvent.click(backdrop);

      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });

  describe('Sheet Variant', () => {
    it('should render sheet dialog when open', async () => {
      renderWithSuspense(
        <UnifiedDialog
          variant="sheet"
          open={true}
          onOpenChange={() => {}}
          title="Test Sheet"
        >
          <p>Sheet content</p>
        </UnifiedDialog>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Sheet')).toBeInTheDocument();
      });
      expect(screen.getByText('Sheet content')).toBeInTheDocument();
    });
  });

  describe('Alert Variant', () => {
    it('should render alert dialog with confirm and cancel buttons', async () => {
      const handleConfirm = vi.fn();

      renderWithSuspense(
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

      await waitFor(() => {
        expect(screen.getByText('Delete?')).toBeInTheDocument();
      });
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', async () => {
      const handleConfirm = vi.fn();

      renderWithSuspense(
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

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(handleConfirm).toHaveBeenCalled();
      });
    });
  });

  describe('Variant Routing', () => {
    it('should route to correct variant based on variant prop', async () => {
      const { rerender } = renderWithSuspense(
        <UnifiedDialog
          variant="modal"
          open={true}
          onOpenChange={() => {}}
          title="Test"
        >
          Content
        </UnifiedDialog>
      );

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });

      // Rerender with sheet variant
      rerender(
        <Suspense fallback={<div>Loading...</div>}>
          <UnifiedDialog
            variant="sheet"
            open={true}
            onOpenChange={() => {}}
            title="Test"
          >
            Content
          </UnifiedDialog>
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });
  });
});
