/**
 * Hook for Tinkoff payments
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createTinkoffPayment, 
  redirectToPayment,
  type CreateTinkoffPaymentParams 
} from '@/services/tinkoffPaymentService';
import type { CreatePaymentResponse } from '@/types/payment';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UseTinkoffPaymentOptions {
  onSuccess?: (response: CreatePaymentResponse) => void;
  onError?: (error: string) => void;
  autoRedirect?: boolean;
}

export function useTinkoffPayment(options: UseTinkoffPaymentOptions = {}) {
  const { onSuccess, onError, autoRedirect = true } = options;
  const queryClient = useQueryClient();
  const [lastResponse, setLastResponse] = useState<CreatePaymentResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: CreateTinkoffPaymentParams) => {
      const response = await createTinkoffPayment(params);
      return response;
    },
    onSuccess: (response) => {
      setLastResponse(response);
      
      if (response.success && response.paymentUrl) {
        logger.info('Tinkoff payment ready', { 
          transactionId: response.transactionId,
          paymentUrl: response.paymentUrl,
        });
        
        onSuccess?.(response);
        
        if (autoRedirect) {
          toast.loading('Переход на страницу оплаты...');
          // Small delay for toast to show
          setTimeout(() => {
            redirectToPayment(response.paymentUrl!);
          }, 500);
        }
      } else {
        const errorMessage = response.error || 'Не удалось создать платёж';
        logger.warn('Tinkoff payment failed', { error: errorMessage });
        toast.error(errorMessage);
        onError?.(errorMessage);
      }
    },
    onError: (error: Error) => {
      const message = error.message || 'Ошибка при создании платежа';
      logger.error('Tinkoff payment mutation error', error);
      toast.error(message);
      onError?.(message);
    },
  });

  const pay = useCallback(
    (productCode: string, options?: Partial<CreateTinkoffPaymentParams>) => {
      return mutation.mutate({
        productCode,
        ...options,
      });
    },
    [mutation]
  );

  const payAsync = useCallback(
    async (productCode: string, options?: Partial<CreateTinkoffPaymentParams>) => {
      return mutation.mutateAsync({
        productCode,
        ...options,
      });
    },
    [mutation]
  );

  return {
    pay,
    payAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    lastResponse,
    reset: mutation.reset,
  };
}
