'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { BrandKitPanel } from '@/components/studio/BrandKitPanel';
import { Settings, User, Shield, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [name,   setName]   = useState('');
  const [email,  setEmail]  = useState('');
  const [mobile, setMobile] = useState('');

  useEffect(() => {
    apiFetch<{ user: { name: string; email: string; mobile: string } }>('/api/auth/me')
      .then((res) => {
        if (!isApiError(res) && res.user) {
          setName(res.user.name);
          setEmail(res.user.email);
          setMobile(res.user.mobile || '');
        }
      });
  }, []);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, mobile }),
      });
      if (isApiError(res)) throw new Error(res.error);
      return res;
    },
    onSuccess: () => toast.success('Profile updated'),
    onError:   (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold"><GradientText>Settings</GradientText></h1>
        <p className="text-sm text-muted-foreground">அமைப்புகள் — Manage your account &amp; brand</p>
      </div>

      {/* ── Profile ─────────────────────────────────────────── */}
      <AnimatedCard hover={false}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold">Profile</h2>
        </div>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={name}   onChange={(e) => setName(e.target.value)}   /></div>
          <div><Label>Email</Label><Input value={email} disabled className="opacity-60"             /></div>
          <div><Label>Mobile</Label><Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 98765 43210" /></div>
          <Button
            onClick={() => updateProfile.mutate()}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </AnimatedCard>

      {/* ── Brand Kit ────────────────────────────────────────── */}
      <BrandKitPanel />

      {/* ── Security ─────────────────────────────────────────── */}
      <AnimatedCard hover={false}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold">Security</h2>
        </div>
        <Button variant="outline">Change Password</Button>
      </AnimatedCard>

      {/* ── Notifications ────────────────────────────────────── */}
      <AnimatedCard hover={false}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold">Notifications</h2>
        </div>
        <p className="text-xs text-muted-foreground">Email notification preferences coming soon</p>
      </AnimatedCard>
    </div>
  );
}
