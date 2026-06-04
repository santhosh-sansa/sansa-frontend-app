'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_GROUPS } from '@/lib/shell-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommandPalette } from '@/components/ui/command-palette';
import { CreditsDisplay } from '@/components/shell/credits-display';
import { apiFetch, isApiError } from '@/lib/api';
import {
  PanelLeftClose, PanelLeft, Sparkles, Bell,
  Search, Plus, LogOut, User, ChevronDown, Zap,
} from 'lucide-react';

/* ─── Group meta ─────────────────────────────────────────────── */
const GROUP_META: Record<string, { emoji: string; color: string }> = {
  'Workspace':       { emoji: '🏠', color: '#818cf8' },
  'Creative Studio': { emoji: '🎨', color: '#f472b6' },
  'Business':        { emoji: '💼', color: '#34d399' },
  'Platform':        { emoji: '⚡', color: '#fbbf24' },
  'Account':         { emoji: '👤', color: '#94a3b8' },
};

/* ─── Nav item active color per route ───────────────────────── */
const ROUTE_COLOR: Record<string, string> = {
  '/':                   '#818cf8',
  '/assistant':          '#60a5fa',
  '/agents':             '#22d3ee',
  '/automation':         '#2dd4bf',
  '/studio/image':       '#f472b6',
  '/studio/editor':      '#fb923c',
  '/studio/video':       '#f87171',
  '/studio/pdf':         '#fb7185',
  '/studio/voice':       '#4ade80',
  '/studio':             '#c084fc',
  '/business/crm':       '#38bdf8',
  '/business/helpdesk':  '#fbbf24',
  '/business/invoices':  '#a3e635',
  '/platform/analytics': '#34d399',
  '/platform/drive':     '#60a5fa',
  '/billing':            '#fcd34d',
  '/settings':           '#94a3b8',
};
const routeColor = (href: string) => ROUTE_COLOR[href] ?? '#818cf8';

type UserProfile = { name: string; email: string; role: string; planId: string };

/* ═══════════════════════════════════════════════════════════════
   CRITICAL LAYOUT CSS — injected inline so it ALWAYS works
   even when Tailwind utility classes don't load
═══════════════════════════════════════════════════════════════ */
const CRITICAL_CSS = `
  .sansa-shell        { display:flex!important; height:100vh!important; overflow:hidden!important; background:#0a0b0f!important; }
  .sansa-sidebar      { display:flex!important; flex-direction:column!important; flex-shrink:0!important; height:100vh!important; background:#0d0e14!important; border-right:1px solid rgba(255,255,255,0.06)!important; transition:width .3s ease!important; overflow:hidden!important; }
  .sansa-sidebar-w    { width:260px; }
  .sansa-sidebar-col  { width:64px; }
  .sansa-main         { display:flex!important; flex-direction:column!important; flex:1!important; overflow:hidden!important; min-width:0!important; }
  .sansa-header       { display:flex!important; align-items:center!important; justify-content:space-between!important; height:56px!important; flex-shrink:0!important; border-bottom:1px solid rgba(255,255,255,0.06)!important; background:rgba(10,11,15,.9)!important; backdrop-filter:blur(12px)!important; padding:0 16px!important; }
  .sansa-content      { flex:1!important; overflow:auto!important; background:#0c0d12!important; }
  .sansa-nav-item     { display:flex!important; align-items:center!important; width:100%!important; gap:10px!important; padding:7px 10px!important; border-radius:12px!important; font-size:12px!important; text-decoration:none!important; transition:all .15s ease!important; cursor:pointer!important; border:none!important; background:transparent!important; }
  .sansa-nav-item:hover { background:rgba(255,255,255,0.06)!important; color:rgba(255,255,255,0.8)!important; }
  .sansa-nav-active   { font-weight:600!important; }
  @media (max-width:1023px) {
    .sansa-sidebar { position:fixed!important; top:0!important; left:0!important; bottom:0!important; z-index:50!important; }
    .sansa-sidebar-hidden { transform:translateX(-100%)!important; }
    .sansa-sidebar-open   { transform:translateX(0)!important; box-shadow:0 0 60px rgba(0,0,0,.8)!important; }
  }
`;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed,    setCollapsed]    = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [commandOpen,  setCommandOpen]  = useState(false);
  const [user,         setUser]         = useState<UserProfile | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('sansa_access_token');
    if (!token) { router.push('/login'); return; }
    apiFetch<{ user: UserProfile }>('/api/auth/me').then((res) => {
      if (!isApiError(res) && res.user) setUser(res.user);
      else if (isApiError(res) && res.status === 401) router.push('/login');
    });
  }, [router]);

  const handleLogout = () => {
    ['sansa_access_token','sansa_refresh_token','sansa_user_id','sansa_user_name','sansa_user_email']
      .forEach((k) => localStorage.removeItem(k));
    router.push('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'S';

  const isLg = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <>
      {/* Critical layout CSS — always works */}
      <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      <CommandPalette open={commandOpen} setOpen={setCommandOpen} />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)' }}
        />
      )}

      {/* ── Outer shell ────────────────────────────────────── */}
      <div className="sansa-shell">

        {/* ── Sidebar ──────────────────────────────────────── */}
        <aside className={cn(
          'sansa-sidebar',
          collapsed ? 'sansa-sidebar-col' : 'sansa-sidebar-w',
          'lg:translate-x-0',
          mobileOpen ? 'sansa-sidebar-open' : 'sansa-sidebar-hidden lg:sansa-sidebar-open',
        )}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', height:56, padding:'0 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', gap:10, flexShrink:0 }}>
            <div style={{ width:36, height:36, borderRadius:12, background:'linear-gradient(135deg,#7c3aed,#db2777)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 14px rgba(124,58,237,.4)' }}>
              <Sparkles style={{ width:18, height:18, color:'#fff' }} />
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontSize:13, fontWeight:900, background:'linear-gradient(90deg,#a78bfa,#f472b6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-.02em' }}>SANSA AI</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', marginTop:1 }}>Creative Workspace</div>
              </div>
            )}
          </div>

          {/* New Chat */}
          <div style={{ padding:12, flexShrink:0 }}>
            <Link href="/assistant" style={{ textDecoration:'none' }}>
              <button style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:12, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', border:'none', boxShadow:'0 4px 14px rgba(124,58,237,.3)', justifyContent: collapsed ? 'center' : 'flex-start' }}>
                <Plus style={{ width:14, height:14, flexShrink:0 }} />
                {!collapsed && <span>New Chat</span>}
                {!collapsed && <Sparkles style={{ width:12, height:12, marginLeft:'auto', opacity:.6 }} />}
              </button>
            </Link>
          </div>

          {/* Navigation */}
          <ScrollArea style={{ flex:1, padding:'0 8px' }}>
            <nav style={{ paddingBottom:16 }}>
              {NAV_GROUPS.map((group) => {
                const meta = GROUP_META[group.title] ?? { emoji: '📁', color: '#818cf8' };
                return (
                  <div key={group.title} style={{ marginBottom:12 }}>
                    {!collapsed && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 8px', marginBottom:4 }}>
                        <span style={{ fontSize:12 }}>{meta.emoji}</span>
                        <span style={{ fontSize:9, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.2)' }}>{group.title}</span>
                      </div>
                    )}
                    {collapsed && <div style={{ height:1, background:'rgba(255,255,255,.06)', margin:'4px 8px 8px' }} />}

                    {group.items.map((item) => {
                      const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                      const color    = routeColor(item.href);
                      return (
                        <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} style={{ textDecoration:'none' }}>
                          <div
                            className="sansa-nav-item"
                            style={{
                              color: isActive ? color : 'rgba(255,255,255,.4)',
                              background: isActive ? `${color}18` : 'transparent',
                              borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent',
                              justifyContent: collapsed ? 'center' : 'flex-start',
                              paddingLeft: collapsed ? 10 : 10,
                            }}
                          >
                            <item.icon style={{ width:15, height:15, flexShrink:0, color: isActive ? color : 'rgba(255,255,255,.35)' }} />
                            {!collapsed && (
                              <>
                                <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }}>{item.label}</span>
                                {item.isNew && (
                                  <span style={{ background:`linear-gradient(135deg,#7c3aed,#db2777)`, color:'#fff', fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:99, letterSpacing:'.04em' }}>NEW</span>
                                )}
                              </>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Credits bar */}
          {!collapsed && (
            <div style={{ margin:'0 12px 8px', padding:12, borderRadius:12, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Zap style={{ width:12, height:12, color:'#fbbf24' }} />
                  <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.4)' }}>Credits</span>
                </div>
                <Link href="/billing" style={{ fontSize:9, color:'#a78bfa', textDecoration:'none', fontWeight:600 }}>Top Up →</Link>
              </div>
              <div style={{ height:6, borderRadius:99, background:'rgba(255,255,255,.08)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:'60%', borderRadius:99, background:'linear-gradient(90deg,#7c3aed,#db2777)' }} />
              </div>
            </div>
          )}

          {/* User profile */}
          <div style={{ padding:'8px 8px 8px', borderTop:'1px solid rgba(255,255,255,.06)', flexShrink:0 }}>
            <div style={{ position:'relative' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:12, cursor:'pointer', border:'none', background:'transparent' }}
                className="sansa-nav-item"
              >
                <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#db2777)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:'#fff', flexShrink:0, position:'relative' }}>
                  {initials}
                  <div style={{ position:'absolute', bottom:-1, right:-1, width:10, height:10, borderRadius:'50%', background:'#10b981', border:'2px solid #0d0e14' }} />
                </div>
                {!collapsed && (
                  <>
                    <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.7)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name || 'User'}</div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'capitalize', marginTop:1 }}>{user?.planId || 'free'} plan</div>
                    </div>
                    <ChevronDown style={{ width:12, height:12, color:'rgba(255,255,255,.3)' }} />
                  </>
                )}
              </button>

              {userMenuOpen && !collapsed && (
                <div style={{ position:'absolute', bottom:'100%', left:0, right:0, marginBottom:4, borderRadius:12, border:'1px solid rgba(255,255,255,.08)', background:'#0f1117', boxShadow:'0 8px 32px rgba(0,0,0,.5)', overflow:'hidden', zIndex:100 }}>
                  <Link href="/settings" onClick={() => setUserMenuOpen(false)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', fontSize:11, color:'rgba(255,255,255,.6)', textDecoration:'none' }} className="sansa-nav-item">
                    <User style={{ width:14, height:14 }} />Profile & Settings
                  </Link>
                  <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 12px', fontSize:11, color:'#f87171', cursor:'pointer', border:'none', background:'transparent' }} className="sansa-nav-item">
                    <LogOut style={{ width:14, height:14 }} />Sign Out
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => setCollapsed(!collapsed)} style={{ width:'100%', display:'flex', justifyContent:'center', alignItems:'center', padding:'6px', borderRadius:10, cursor:'pointer', border:'none', background:'transparent', color:'rgba(255,255,255,.2)', marginTop:2 }} className="sansa-nav-item">
              {collapsed ? <PanelLeft style={{ width:14, height:14 }} /> : <PanelLeftClose style={{ width:14, height:14 }} />}
            </button>
          </div>
        </aside>

        {/* ── Main ───────────────────────────────────────────── */}
        <div className="sansa-main">

          {/* Header */}
          <header className="sansa-header">
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={() => setMobileOpen(true)} style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'none', background:'transparent', color:'rgba(255,255,255,.4)', cursor:'pointer' }} className="lg:hidden">
                <PanelLeft style={{ width:16, height:16 }} />
              </button>
              <button onClick={() => setCommandOpen(true)} style={{ display:'flex', alignItems:'center', gap:10, height:36, padding:'0 12px', borderRadius:12, border:'1px solid rgba(255,255,255,.08)', background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.3)', cursor:'pointer', fontSize:12, minWidth:200 }}>
                <Search style={{ width:14, height:14 }} />
                <span style={{ flex:1, textAlign:'left' }}>Search anything...</span>
                <kbd style={{ padding:'2px 6px', borderRadius:6, border:'1px solid rgba(255,255,255,.08)', background:'rgba(255,255,255,.04)', fontSize:10, color:'rgba(255,255,255,.2)' }}>⌘K</kbd>
              </button>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <CreditsDisplay />
              <button style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'none', background:'transparent', color:'rgba(255,255,255,.4)', cursor:'pointer', position:'relative' }}>
                <Bell style={{ width:16, height:16 }} />
                <div style={{ position:'absolute', top:6, right:6, width:6, height:6, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#db2777)' }} />
              </button>
              <ThemeToggle />
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#db2777)', border:'2px solid rgba(124,58,237,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff', cursor:'pointer' }}>
                {initials}
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="sansa-content">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
