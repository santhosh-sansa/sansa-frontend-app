'use client';

import { useEffect } from 'react';
import { Providers } from '@/components/providers';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Providers>
      <div className="min-h-screen flex items-center justify-center bg-[#0c0d12]">
        <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl max-w-lg">
          <h1 className="text-4xl font-bold text-white mb-4">எதிர்பாராத பிழை ஏற்பட்டது</h1>
          <p className="text-gray-400 mb-8">
            An unexpected error occurred. Our team has been notified.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => reset()}
              variant="default"
              className="bg-purple-600 hover:bg-purple-700"
            >
              மீண்டும் முயற்சிக்கவும் (Try Again)
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-white/10 hover:bg-white/5"
            >
              முகப்புக்குச் செல்க
            </Button>
          </div>
        </div>
      </div>
    </Providers>
  );
}
