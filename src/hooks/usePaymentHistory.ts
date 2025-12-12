/**
 * usePaymentHistory Hook
 * Infinite scroll hook for transaction history with react-virtuoso
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { getPaymentHistory, type PaymentTransaction } from '@/services/starsPaymentService';

// Query key factory
export const paymentHistoryKeys = {
  all: ['payment-history'] as const,
  list: (userId: string) => [...paymentHistoryKeys.all, 'list', userId] as const,
};

interface UsePaymentHistoryOptions {
  userId: string;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Fetch payment history with infinite scroll support
 */
export function usePaymentHistory({
  userId,
  pageSize = 20,
  enabled = true,
}: UsePaymentHistoryOptions) {
  const query = useInfiniteQuery({
    queryKey: paymentHistoryKeys.list(userId),
    queryFn: ({ pageParam = 0 }) => getPaymentHistory(userId, pageParam, pageSize),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length; // Next page number
    },
    initialPageParam: 0,
    enabled: enabled && !!userId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Flatten all pages into a single array
  const transactions: PaymentTransaction[] =
    query.data?.pages.flatMap((page) => page.transactions) ?? [];

  return {
    ...query,
    transactions,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoadingMore: query.isFetchingNextPage,
  };
}

/**
 * Get recent transactions (first page only)
 */
export function useRecentTransactions(userId: string, limit: number = 5) {
  const { transactions, isLoading, error } = usePaymentHistory({
    userId,
    pageSize: limit,
  });

  return {
    transactions: transactions.slice(0, limit),
    isLoading,
    error,
  };
}
