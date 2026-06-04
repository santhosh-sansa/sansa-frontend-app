'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiFetch, isApiError, setTokens, hydrateUserCache } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import { GradientText } from '@/components/ui/gradient-text';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.sansaai.in';

// ─── Google SVG ───────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);

  // ── Handle OAuth callback redirect ──────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const error        = params.get('error');

    if (error) {
      toast.error(
        error === 'oauth_cancelled' ? 'Google login cancelled.' :
        error === 'oauth_failed'    ? 'Google login failed. Please try again.' :
        'Login error. Please try again.',
      );
      // Clean URL
      window.history.replaceState({}, '', '/login');
      return;
    }

    if (accessToken) {
      setTokens(accessToken, refreshToken || undefined);
      // Fetch & cache user info (id, name, email)
      void hydrateUserCache().then(() => {
        toast.success('Signed in with Google! 🎉');
        router.push('/');
      });
    }
  }, [router]);

  // ── Email/password login ─────────────────────────────────────
  const login = useMutation({
    mutationFn: async () => {
      const res = await apiFetch<{ accessToken?: string; refreshToken?: string }>(
        '/api/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      );
      if (isApiError(res)) throw new Error(res.error || 'Login failed');
      if (!res.accessToken) throw new Error('No access token returned');
      return res;
    },
    onSuccess: async (res) => {
      setTokens(res.accessToken!, res.refreshToken);
      await hydrateUserCache();
      toast.success('Welcome back! 👋');
      router.push('/');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); login.mutate(); };

  const handleOAuth = (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    window.location.href = `${API}/api/auth/${provider}`;
  };

  const isPending = login.isPending;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left decorative panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-background p-12 border-r border-border">
        <div className="max-w-xs text-center space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <span className="text-2xl">✦</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">SANSA AI</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              <GradientText>Tamil + English AI Workspace</GradientText>
            </h2>
            <p className="text-sm text-muted-foreground">
              உங்கள் வணிகத்திற்காக — Create designs, write content, and grow your business with AI
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3 text-left">
            {[
              { emoji: '🎨', text: 'AI-powered design studio' },
              { emoji: '📝', text: 'Tamil + English content generation' },
              { emoji: '🖼️', text: '500+ ready-made templates' },
              { emoji: '⚡', text: 'Real-time collaboration' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-4 py-3">
                <span className="text-xl">{f.emoji}</span>
                <span className="text-sm text-muted-foreground">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm space-y-8">

          {/* Header */}
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold">
              <GradientText>Sign in</GradientText>
            </h1>
            <p className="text-sm text-muted-foreground">
              உங்கள் கணக்கில் நுழையுங்கள்
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-3 h-11 text-sm font-medium"
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading || isPending}
            >
              {oauthLoading === 'google'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <GoogleIcon className="h-4 w-4" />}
              Continue with Google
            </Button>

            <Button
              variant="outline"
              className="w-full gap-3 h-11 text-sm font-medium"
              onClick={() => handleOAuth('github')}
              disabled={!!oauthLoading || isPending}
            >
              {oauthLoading === 'github'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <GitHubIcon className="h-4 w-4" />}
              Continue with GitHub
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">
                அல்லது email மூலம் / or continue with email
              </span>
            </div>
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isPending}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isPending}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={isPending || !!oauthLoading}
            >
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : 'Sign in'}
            </Button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground">
            கணக்கு இல்லையா?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
