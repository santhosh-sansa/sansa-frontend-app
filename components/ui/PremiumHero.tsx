'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export function PremiumHero() {
  const router = useRouter();

  return (
    <div className="relative min-h-[70vh] overflow-hidden rounded-2xl">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 bg-[length:200%_200%]" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white/30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative rotating ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/10 animate-rotate-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5 animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] text-center px-4 py-16">
        {/* Logo */}
        <div className="mb-6 animate-blur-in">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto shadow-2xl ring-1 ring-white/20 animate-glow-pulse">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Create Like Never
          <span className="block mt-2 bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
            Before
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          SANSA AI brings Adobe-level creative power to everyone.
          Generate, edit, and create stunning content with AI.
        </p>
        <p className="text-sm text-white/60 mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          AI படைப்பாற்றல் — எல்லோருக்கும் Adobe-தர கருவிகள்
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4 flex-wrap justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <button
            onClick={() => router.push('/register')}
            className="px-8 py-3 bg-white text-purple-700 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 hover-lift"
          >
            Start Creating Free ✨
          </button>
          <button
            onClick={() => router.push('/assistant')}
            className="px-8 py-3 border border-white/30 rounded-full text-white font-semibold backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
          >
            Try AI Chat →
          </button>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          {[
            { value: '70+', label: 'AI Tools' },
            { value: '30+', label: 'Templates' },
            { value: '₹49', label: 'Starting Price' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/60 rounded-full animate-float" />
          </div>
        </div>
      </div>
    </div>
  );
}
