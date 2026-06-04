'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Fabric.js touches browser APIs — must be client-only, no SSR
// Wrapped in Suspense so useSearchParams() works with static export
const FabricEditor = dynamic(
  () => import('@/components/editor/FabricEditor').then((m) => ({ default: m.FabricEditor })),
  { ssr: false },
);

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground text-sm gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      Loading editor…
    </div>
  );
}

export default function DesignEditorPage() {
  return (
    <div className="h-full">
      <Suspense fallback={<LoadingFallback />}>
        <FabricEditor />
      </Suspense>
    </div>
  );
}
