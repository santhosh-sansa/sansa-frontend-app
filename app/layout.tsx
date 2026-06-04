import type { Metadata } from 'next';
import {
  Inter,
  Noto_Sans_Tamil,
  Noto_Serif_Tamil,
  Catamaran,
  Baloo_Thambi_2,
  Meera_Inimai,
  Mukta_Malar,
} from 'next/font/google';
import { Providers } from '@/components/providers';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import './globals.css';

// ── Latin UI font ─────────────────────────────────────────────
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

// ── Tamil fonts ───────────────────────────────────────────────
const notoSansTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-noto-sans-tamil',
  display: 'swap',
  preload: false,   // load on demand
});

const notoSerifTamil = Noto_Serif_Tamil({
  subsets: ['tamil'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-noto-serif-tamil',
  display: 'swap',
  preload: false,
});

const catamaran = Catamaran({
  subsets: ['tamil', 'latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-catamaran',
  display: 'swap',
  preload: false,
});

const balooThambi = Baloo_Thambi_2({
  subsets: ['tamil', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-baloo-thambi',
  display: 'swap',
  preload: false,
});

const meeraInimai = Meera_Inimai({
  subsets: ['tamil'],
  weight: ['400'],
  variable: '--font-meera-inimai',
  display: 'swap',
  preload: false,
});

const muktaMalar = Mukta_Malar({
  subsets: ['tamil', 'latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-mukta-malar',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'SANSA AI — AI Workspace Platform',
  description: 'AI-powered workspace for creative design, business management, and productivity.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    inter.variable,
    notoSansTamil.variable,
    notoSerifTamil.variable,
    catamaran.variable,
    balooThambi.variable,
    meeraInimai.variable,
    muktaMalar.variable,
  ].join(' ');

  return (
    <html lang="ta-IN" suppressHydrationWarning className="dark">
      <body className={`${fontVars} font-sans`} style={{ background: '#0c0d12', color: '#f1f5f9' }}>
        <Providers>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </Providers>
      </body>
    </html>
  );
}
