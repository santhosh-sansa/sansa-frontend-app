'use client';

import { Sparkles } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center z-50">
      <div className="relative flex items-center justify-center">
        {/* Outer ring - slow clockwise */}
        <div className="absolute w-32 h-32 border-4 border-purple-500/30 rounded-full animate-spin" style={{ animationDuration: '3s' }} />

        {/* Middle ring - faster counter-clockwise */}
        <div className="absolute w-24 h-24 border-4 border-pink-500/30 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />

        {/* Inner ring - fastest clockwise */}
        <div className="absolute w-16 h-16 border-4 border-blue-500/30 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />

        {/* Gradient dots on rings */}
        <div className="absolute w-32 h-32 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50" />
        </div>
        <div className="absolute w-24 h-24 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-pink-500 rounded-full shadow-lg shadow-pink-500/50" />
        </div>

        {/* Center logo */}
        <div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse">
          <Sparkles className="h-5 w-5 text-white" />
        </div>

        {/* Loading text */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center">
          <p className="text-sm text-white/70 font-medium">Loading SANSA AI</p>
          <p className="text-xs text-white/40 mt-1">ஏற்றுகிறது...</p>
          {/* Animated dots */}
          <div className="flex justify-center gap-1 mt-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
