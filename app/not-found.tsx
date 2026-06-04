'use client';

import { Providers } from '@/components/providers';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Providers>
      <div className="min-h-screen flex items-center justify-center bg-[#0c0d12]">
        <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl">
          <h1 className="text-8xl font-black bg-gradient-to-br from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">404</h1>
          <h2 className="text-2xl font-bold text-white mb-4">பக்கம் காணப்படவில்லை</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
          >
            முகப்புக்குச் செல்க (Go Home)
          </Link>
        </div>
      </div>
    </Providers>
  );
}
