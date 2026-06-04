'use client';

import { useSocket } from '@/hooks/use-socket';
import { PulseDot } from '@/components/ui/pulse-dot';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectionStatus() {
  const { connected } = useSocket();

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all',
        connected
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      )}
    >
      {connected ? (
        <>
          <PulseDot status="online" size="sm" />
          <span className="hidden sm:inline">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span className="hidden sm:inline">Connecting…</span>
        </>
      )}
    </div>
  );
}
