import { useQuery } from '@tanstack/react-query';
import * as adminApi from '@/api/admin.api';
import type { UserBalanceSummary, UserWithBalance } from '@/api/admin.api';

export function useUserBalanceSummary() {
  return useQuery({
    queryKey: ['user-balance-summary'],
    queryFn: adminApi.fetchUserBalanceSummary,
    refetchInterval: 60000,
  });
}

export function useUsersWithBalances(options: { limit?: number; orderBy?: 'balance' | 'created_at' } = {}) {
  const { limit = 100, orderBy = 'created_at' } = options;

  return useQuery({
    queryKey: ['users-with-balances', limit, orderBy],
    queryFn: () => adminApi.fetchUsersWithBalances({ limit, orderBy }),
  });
}

export type { UserBalanceSummary, UserWithBalance };
