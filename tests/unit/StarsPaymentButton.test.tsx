/**
 * Unit Tests for StarsPaymentButton Component
 * 
 * Task: T101
 * Tests: onClick, loading state, error state
 */

import { describe, it, expect, vi } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StarsPaymentButton } from '@/components/payments/StarsPaymentButton';
import { useStarsPayment } from '@/hooks/useStarsPayment';

// Mock the useStarsPayment hook
vi.mock('@/hooks/useStarsPayment');

describe('StarsPaymentButton', () => {
  const mockCreateInvoice = vi.fn();
  const mockOpenInvoice = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useStarsPayment as any).mockReturnValue({
      createInvoice: mockCreateInvoice,
      openInvoice: mockOpenInvoice,
      isLoading: false,
      error: null,
    });
  });

  /**
   * Test: onClick handler
   */
  describe('onClick handler', () => {
    it('should call createInvoice when clicked', async () => {
      render(<StarsPaymentButton productCode="credits_100" />);
      
      const button = screen.getByRole('button', { name: /buy with stars/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockCreateInvoice).toHaveBeenCalledWith('credits_100');
      });
    });

    it('should open invoice after creation', async () => {
      mockCreateInvoice.mockResolvedValue({
        invoiceLink: 'https://t.me/$bot/invoice',
        transactionId: 'test-id',
      });

      render(<StarsPaymentButton productCode="credits_100" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOpenInvoice).toHaveBeenCalledWith('https://t.me/$bot/invoice');
      });
    });

    it('should not trigger if already loading', () => {
      (useStarsPayment as any).mockReturnValue({
        createInvoice: mockCreateInvoice,
        isLoading: true,
        error: null,
      });

      render(<StarsPaymentButton productCode="credits_100" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockCreateInvoice).not.toHaveBeenCalled();
    });
  });

  /**
   * Test: Loading state
   */
  describe('loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      (useStarsPayment as any).mockReturnValue({
        createInvoice: mockCreateInvoice,
        isLoading: true,
        error: null,
      });

      render(<StarsPaymentButton productCode="credits_100" />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      (useStarsPayment as any).mockReturnValue({
        createInvoice: mockCreateInvoice,
        isLoading: true,
        error: null,
      });

      render(<StarsPaymentButton productCode="credits_100" />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show "Processing..." text when loading', () => {
      (useStarsPayment as any).mockReturnValue({
        createInvoice: mockCreateInvoice,
        isLoading: true,
        error: null,
      });

      render(<StarsPaymentButton productCode="credits_100" />);
      
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Error state
   */
  describe('error state', () => {
    it('should display error message when error occurs', () => {
      (useStarsPayment as any).mockReturnValue({
        createInvoice: mockCreateInvoice,
        isLoading: false,
        error: { message: 'Product not found' },
      });

      render(<StarsPaymentButton productCode="credits_100" />);
      
      expect(screen.getByText(/product not found/i)).toBeInTheDocument();
    });

    it('should allow retry after error', async () => {
      (useStarsPayment as any).mockReturnValue({
        createInvoice: mockCreateInvoice,
        isLoading: false,
        error: { message: 'Network error' },
      });

      render(<StarsPaymentButton productCode="credits_100" />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockCreateInvoice).toHaveBeenCalled();
      });
    });

    it('should clear error on successful retry', async () => {
      const mockClearError = vi.fn();
      (useStarsPayment as any).mockReturnValue({
        createInvoice: mockCreateInvoice,
        clearError: mockClearError,
        isLoading: false,
        error: { message: 'Network error' },
      });

      render(<StarsPaymentButton productCode="credits_100" />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });
  });

  /**
   * Test: Telegram Stars icon
   */
  describe('Telegram Stars icon', () => {
    it('should render Stars icon', () => {
      render(<StarsPaymentButton productCode="credits_100" />);
      
      const icon = screen.getByTestId('stars-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should have correct icon color', () => {
      render(<StarsPaymentButton productCode="credits_100" />);
      
      const icon = screen.getByTestId('stars-icon');
      expect(icon).toHaveStyle({ color: '#FFB900' }); // Telegram Stars gold
    });
  });

  /**
   * Test: Accessibility
   */
  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StarsPaymentButton productCode="credits_100" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Stars'));
    });

    it('should be keyboard accessible', () => {
      render(<StarsPaymentButton productCode="credits_100" />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});
