/**
 * useStarsPayment Hook
 * Handles payment flow with invoice creation and Telegram integration
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import WebApp from '@twa-dev/sdk';
import { toast } from 'sonner';
import { createInvoice } from '@/services/starsPaymentService';
import type { StarsProduct } from '@/services/starsPaymentService';
import type { CreateInvoiceRequest } from '@/types/starsPayment';

// Payment flow state
interface PaymentFlowState {
  step: 'select' | 'invoice' | 'payment' | 'success' | 'error';
  selectedProduct?: StarsProduct;
  invoiceLink?: string;
  error?: { code: string; message: string };
}

// Query key for invalidation
const CREDITS_QUERY_KEY = ['user', 'credits'];
const SUBSCRIPTION_QUERY_KEY = ['subscription', 'status'];

export function useStarsPayment() {
  const queryClient = useQueryClient();
  const [flowState, setFlowState] = useState<PaymentFlowState>({
    step: 'select',
  });

  // Invoice creation mutation
  const createInvoiceMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (data) => {
      setFlowState((prev) => ({
        ...prev,
        step: 'invoice',
        invoiceLink: data.invoiceLink,
      }));
    },
    onError: (error: Error) => {
      setFlowState((prev) => ({
        ...prev,
        step: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      }));
      toast.error('Invoice Creation Failed', {
        description: error.message,
      });
    },
  });

  /**
   * Initiate payment flow for a product
   */
  const initiatePayment = useCallback(
    async (product: StarsProduct, userId: string) => {
      // Reset flow state
      setFlowState({
        step: 'select',
        selectedProduct: product,
      });

      try {
        // Create invoice
        const request: CreateInvoiceRequest = {
          productId: product.product_code,
          userId,
          metadata: {
            source: 'mini_app',
          },
        };

        const response = await createInvoiceMutation.mutateAsync(request);

        // Open invoice in Telegram
        if (WebApp.isVersionAtLeast('6.1')) {
          WebApp.openInvoice(response.invoiceLink, (status) => {
            if (status === 'paid') {
              handlePaymentSuccess(product);
            } else if (status === 'failed') {
              handlePaymentError('Payment failed');
            } else if (status === 'cancelled') {
              handlePaymentCancelled();
            }
          });

          setFlowState((prev) => ({
            ...prev,
            step: 'payment',
          }));
        } else {
          // Fallback for older Telegram versions
          toast.error('Update Required', {
            description: 'Please update your Telegram app to make payments.',
          });
        }
      } catch (error) {
        console.error('Payment initiation error:', error);
      }
    },
    [createInvoiceMutation]
  );

  /**
   * Handle successful payment
   */
  const handlePaymentSuccess = useCallback(
    (product: StarsProduct) => {
      setFlowState((prev) => ({
        ...prev,
        step: 'success',
      }));

      // Optimistically update credits or subscription status
      if (product.product_type === 'credits' && product.credits_amount) {
        queryClient.invalidateQueries({ queryKey: CREDITS_QUERY_KEY });
      } else if (product.product_type === 'subscription') {
        queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
      }

      toast.success('Payment Successful! 🎉', {
        description:
          product.product_type === 'credits'
            ? `${product.credits_amount} credits added to your account`
            : `${product.subscription_tier} subscription activated`,
      });

      // Reset state after 2 seconds
      setTimeout(() => {
        setFlowState({ step: 'select' });
      }, 2000);
    },
    [queryClient]
  );

  /**
   * Handle payment error
   */
  const handlePaymentError = useCallback(
    (message: string) => {
      setFlowState((prev) => ({
        ...prev,
        step: 'error',
        error: {
          code: 'PAYMENT_FAILED',
          message,
        },
      }));

      toast.error('Payment Failed', {
        description: message,
      });
    },
    []
  );

  /**
   * Handle payment cancellation
   */
  const handlePaymentCancelled = useCallback(() => {
    setFlowState({ step: 'select' });

    toast.info('Payment Cancelled', {
      description: 'You can try again anytime.',
    });
  }, []);

  /**
   * Reset payment flow
   */
  const resetFlow = useCallback(() => {
    setFlowState({ step: 'select' });
  }, []);

  return {
    flowState,
    initiatePayment,
    resetFlow,
    isCreatingInvoice: createInvoiceMutation.isPending,
    error: flowState.error,
  };
}
