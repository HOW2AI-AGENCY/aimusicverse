/**
 * Unit Tests for StarsPaymentButton Component
 *
 * Task: T101
 * Tests: onClick, loading state, disabled state, icon, accessibility
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { StarsPaymentButton } from "@/components/payments/StarsPaymentButton";

describe("StarsPaymentButton", () => {
  /**
   * Test: onClick handler
   */
  describe("onClick handler", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      render(<StarsPaymentButton onClick={handleClick} />);

      const button = screen.getByRole("button", { name: /pay with telegram stars/i });
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", () => {
      const handleClick = vi.fn();
      render(<StarsPaymentButton onClick={handleClick} disabled />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should not call onClick when loading", () => {
      const handleClick = vi.fn();
      render(<StarsPaymentButton onClick={handleClick} isLoading />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  /**
   * Test: Loading state
   */
  describe("loading state", () => {
    it("should disable button when loading", () => {
      render(<StarsPaymentButton isLoading />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it('should show "Processing..." text when loading', () => {
      render(<StarsPaymentButton isLoading />);

      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });

    it("should not show default children text when loading", () => {
      render(<StarsPaymentButton isLoading />);

      expect(screen.queryByText(/buy with stars/i)).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Default rendering
   */
  describe("default rendering", () => {
    it('should render default "Buy with Stars" text', () => {
      render(<StarsPaymentButton />);

      expect(screen.getByText(/buy with stars/i)).toBeInTheDocument();
    });

    it("should render custom children text", () => {
      render(<StarsPaymentButton>Purchase 100 Credits</StarsPaymentButton>);

      expect(screen.getByText("Purchase 100 Credits")).toBeInTheDocument();
    });
  });

  /**
   * Test: Accessibility
   */
  describe("accessibility", () => {
    it("should have proper ARIA label", () => {
      render(<StarsPaymentButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Pay with Telegram Stars");
    });

    it("should be keyboard accessible", () => {
      render(<StarsPaymentButton />);

      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});
