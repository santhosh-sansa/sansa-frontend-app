import { AppShell } from '@/components/AppShell';
import { CommandPalette } from '@/components/ui/command-palette';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
