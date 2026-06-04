'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiList } from '@/hooks/use-api-list';

type Props = {
  title: string;
  fetchPath: string;
  renderItem: (item: Record<string, unknown>) => React.ReactNode;
};

export function DataListPage({ title, fetchPath, renderItem }: Props) {
  const { data: items = [], isLoading, isError, error } = useApiList(fetchPath);

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>

      {isLoading && (
        <div className="grid gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {!isLoading && (
        <ul className="grid list-none gap-2 p-0">
          {(items as Record<string, unknown>[]).map((item, i) => (
            <li key={String(item.id ?? i)}>
              <Card>
                <CardContent className="p-4">{renderItem(item)}</CardContent>
              </Card>
            </li>
          ))}
          {!items.length && !isError && (
            <li className="text-sm text-muted-foreground">No records yet.</li>
          )}
        </ul>
      )}
    </div>
  );
}
