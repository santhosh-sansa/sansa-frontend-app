'use client';

import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { CollabUser } from '@/hooks/use-collab';
import { Wifi, WifiOff, Users, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  peers: CollabUser[];
  connected: boolean;
  memberCount: number;
  isHost: boolean;
  roomId: string;
  currentUserName: string;
  currentUserColor: string;
}

/** Avatar bubble for one user */
function UserAvatar({
  name, color, isYou = false, isTransforming = false, size = 'md',
}: {
  name: string; color: string; isYou?: boolean;
  isTransforming?: boolean; size?: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        'ring-2 ring-background transition-transform',
        isTransforming && 'scale-110',
        size === 'sm' ? 'h-6 w-6 text-[9px]' : 'h-8 w-8 text-xs',
      )}
      style={{ background: color }}
      title={isYou ? `${name} (you)` : name}
    >
      {name.slice(0, 2).toUpperCase()}
      {isTransforming && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 border border-background" />
      )}
      {isYou && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-background" />
      )}
    </div>
  );
}

export const CollabPresenceBar = memo(function CollabPresenceBar({
  peers,
  connected,
  memberCount,
  isHost,
  roomId,
  currentUserName,
  currentUserColor,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyInviteLink = async () => {
    const url = `${window.location.origin}/studio/editor?room=${roomId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Show max 4 avatars, then +N overflow
  const MAX_SHOWN = 4;
  const shownPeers = peers.slice(0, MAX_SHOWN);
  const overflow   = peers.length - MAX_SHOWN;

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors',
      connected
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-border bg-muted/30',
    )}>
      {/* Connection indicator */}
      <div className={cn(
        'flex items-center gap-1.5 font-medium',
        connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
      )}>
        {connected
          ? <Wifi className="h-3.5 w-3.5" />
          : <WifiOff className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">
          {connected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* Avatars */}
      <div className="flex items-center">
        {/* Self */}
        <div className="-mr-1.5">
          <UserAvatar name={currentUserName} color={currentUserColor} isYou />
        </div>

        {/* Peers */}
        {shownPeers.map((peer, i) => (
          <div key={peer.userId} className="-mr-1.5" style={{ zIndex: 10 - i }}>
            <UserAvatar
              name={peer.name}
              color={peer.color}
              isTransforming={peer.isTransforming}
            />
          </div>
        ))}

        {/* Overflow */}
        {overflow > 0 && (
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              'border-2 border-background bg-muted text-[10px] font-bold text-muted-foreground',
            )}
          >
            +{overflow}
          </div>
        )}
      </div>

      {/* Member count */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <Users className="h-3 w-3" />
        <span>{memberCount}</span>
      </div>

      {/* Host badge */}
      {isHost && (
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
          HOST
        </span>
      )}

      {/* Invite link */}
      {connected && (
        <button
          onClick={copyInviteLink}
          className="ml-1 flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Copy invite link"
        >
          {copied
            ? <><Check className="h-3 w-3 text-emerald-500" /> Copied!</>
            : <><Copy className="h-3 w-3" /> Invite</>}
        </button>
      )}

      {/* Live peers tooltip on hover */}
      {peers.length > 0 && (
        <div className="group relative hidden sm:block">
          <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            ···
          </button>
          <div className="absolute right-0 top-full z-50 mt-1 hidden min-w-36 rounded-lg border border-border bg-popover p-2 shadow-lg group-hover:block">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              In this session
            </p>
            <div className="space-y-1">
              {/* Self */}
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs truncate">{currentUserName} (you)</span>
              </div>
              {peers.map((p) => (
                <div key={p.userId} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-xs truncate">{p.name}</span>
                  {p.isTransforming && (
                    <span className="text-[9px] text-amber-500 ml-auto">editing</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
