'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText, Plus, IndianRupee } from 'lucide-react';

type Invoice = { id: string; invoiceNumber: string; clientName: string; total: number; status: string; createdAt: string };

export default function InvoicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await apiFetch<{ invoices: Invoice[] }>('/api/invoices');
      if (isApiError(res)) throw new Error(res.error);
      return res.invoices || [];
    },
  });

  const statusColor = (s: string) => s === 'paid' ? 'text-emerald-600 bg-emerald-500/10' : s === 'sent' ? 'text-blue-600 bg-blue-500/10' : 'text-muted-foreground bg-muted';

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold"><GradientText>Invoices</GradientText></h1>
          <p className="text-sm text-muted-foreground">விலைப்பட்டியல் — Create & manage invoices</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" />Create Invoice</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="No invoices" description="Create your first invoice" action={<Button>Create Invoice</Button>} />
      ) : (
        <div className="space-y-3">
          {data.map((inv) => (
            <AnimatedCard key={inv.id} className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground">{inv.clientName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold flex items-center gap-0.5"><IndianRupee className="h-3 w-3" />{Number(inv.total).toLocaleString()}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColor(inv.status)}`}>{inv.status}</span>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
