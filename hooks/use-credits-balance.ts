'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCreditsBalance() {
  return useQuery({
    queryKey: queryKeys.credits.balance,
    queryFn: async () => {
      const res = await apiFetch<{ balance: number }>('/api/credits/balance');
      if (isApiError(res)) {
        throw new Error(res.error);
      }
      return res.balance;
    },
    staleTime: 30_000,
  });
}
