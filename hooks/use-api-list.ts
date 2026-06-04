'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

type ListResponse = {
  items?: unknown[];
  data?: unknown[];
};

function normalizeList(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    const obj = res as ListResponse;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
}

export function useApiList(path: string) {
  return useQuery({
    queryKey: queryKeys.apiList(path),
    queryFn: async () => {
      const res = await apiFetch<unknown>(path);
      if (isApiError(res)) {
        throw new Error(res.error);
      }
      return normalizeList(res);
    },
  });
}
