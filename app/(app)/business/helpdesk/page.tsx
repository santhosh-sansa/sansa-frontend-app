'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PulseDot } from '@/components/ui/pulse-dot';
import { Ticket, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';

type TicketItem = { id: string; subject: string; status: string; priority: string; createdAt: string };

export default function HelpdeskPage() {
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['helpdesk', 'tickets'],
    queryFn: async () => {
      const res = await apiFetch<{ tickets: TicketItem[] }>('/api/helpdesk/tickets');
      if (isApiError(res)) throw new Error(res.error);
      return res.tickets || [];
    },
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/helpdesk/tickets', { method: 'POST', body: JSON.stringify({ subject, description }) });
      if (isApiError(res)) throw new Error(res.error);
      return res;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['helpdesk'] }); setShowForm(false); setSubject(''); setDescription(''); toast.success('Ticket created'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusDot = (s: string) => s === 'open' ? 'processing' as const : s === 'resolved' ? 'online' as const : 'idle' as const;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold"><GradientText>Helpdesk</GradientText></h1>
          <p className="text-sm text-muted-foreground">உதவி டிக்கெட்கள் — Support tickets</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2"><Plus className="h-4 w-4" />New Ticket</Button>
      </div>

      {showForm && (
        <AnimatedCard hover={false}>
          <div className="space-y-3">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your issue..." />
            <Button onClick={() => createTicket.mutate()} disabled={!subject || createTicket.isPending}>{createTicket.isPending ? 'Creating...' : 'Submit Ticket'}</Button>
          </div>
        </AnimatedCard>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={<Ticket className="h-6 w-6" />} title="No tickets" description="All clear! Create a ticket if you need help." />
      ) : (
        <div className="space-y-3">
          {data.map((t) => (
            <AnimatedCard key={t.id} className="flex items-center gap-4">
              <PulseDot status={statusDot(t.status)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.subject}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground capitalize">{t.status}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground capitalize">{t.priority}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{new Date(t.createdAt).toLocaleDateString()}</div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
