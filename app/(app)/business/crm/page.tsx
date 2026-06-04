'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PulseDot } from '@/components/ui/pulse-dot';
import { Users, Plus, Phone, Mail, Building2, X } from 'lucide-react';
import { toast } from 'sonner';

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  stage: string;
  createdAt: string;
};

const STAGES = ['lead', 'prospect', 'negotiation', 'customer', 'churned'];
const stageColors: Record<string, string> = {
  lead: 'bg-blue-500/10 text-blue-600',
  prospect: 'bg-amber-500/10 text-amber-600',
  negotiation: 'bg-purple-500/10 text-purple-600',
  customer: 'bg-emerald-500/10 text-emerald-600',
  churned: 'bg-red-500/10 text-red-600',
};

export default function CrmPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', stage: 'lead' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'contacts'],
    queryFn: async () => {
      const res = await apiFetch<{ contacts: Contact[] }>('/api/crm/contacts');
      if (isApiError(res)) throw new Error(res.error);
      return res.contacts || [];
    },
  });

  const addContact = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/crm/contacts', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (isApiError(res)) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'contacts'] });
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', company: '', stage: 'lead' });
      toast.success('Contact added');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold"><GradientText>CRM</GradientText></h1>
          <p className="text-sm text-muted-foreground">தொடர்புகள் நிர்வகிக்கவும் — Manage your contacts & leads</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Contact
        </Button>
      </div>

      {showForm && (
        <AnimatedCard hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">New Contact</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contact name" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" /></div>
            <div><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" /></div>
          </div>
          <div className="mt-4 flex gap-2">
            {STAGES.map((s) => (
              <button key={s} onClick={() => setForm({ ...form, stage: s })} className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${form.stage === s ? stageColors[s] : 'bg-muted text-muted-foreground'}`}>{s}</button>
            ))}
          </div>
          <Button className="mt-4" onClick={() => addContact.mutate()} disabled={!form.name || addContact.isPending}>
            {addContact.isPending ? 'Saving...' : 'Save Contact'}
          </Button>
        </AnimatedCard>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : !data?.length ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No contacts yet" description="Add your first contact to get started" action={<Button onClick={() => setShowForm(true)}>Add Contact</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((contact) => (
            <AnimatedCard key={contact.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{contact.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${stageColors[contact.stage] || 'bg-muted'}`}>{contact.stage}</span>
              </div>
              {contact.company && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3 w-3" />{contact.company}</div>}
              {contact.email && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{contact.email}</div>}
              {contact.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{contact.phone}</div>}
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
