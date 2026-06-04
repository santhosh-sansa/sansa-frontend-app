/**
 * SANSA AI — Tamil & Latin Font Registry
 *
 * Fabric.js renders text on a <canvas> using the browser's font engine.
 * Fonts must be loaded into document.fonts BEFORE Fabric draws text,
 * otherwise it falls back to the system default.
 *
 * Flow:
 *   1. Next.js loads @font-face rules via next/font/google (layout.tsx)
 *   2. When user picks a font, call loadFont() to trigger actual download
 *   3. document.fonts.load() resolves once the font bytes are available
 *   4. Fabric renders crisp Tamil / Latin text on canvas
 */

// ─── Font descriptor ──────────────────────────────────────────

export type FontScript = 'latin' | 'tamil' | 'both';
export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';

export interface FontInfo {
  /** Exact name to pass to Fabric / CSS font-family */
  family: string;
  /** Display name shown in the picker */
  label: string;
  /** Tamil label (shown when Tamil UI is active) */
  labelTa?: string;
  /** Which scripts this font covers */
  script: FontScript;
  category: FontCategory;
  /** Sample text shown in the font picker preview */
  sample: string;
  /** Sample shown when Tamil script is active */
  sampleTa?: string;
  /** CSS variable set in layout.tsx (used for preview <span>) */
  cssVar?: string;
  /** Available weights */
  weights: number[];
  /** Google Fonts URL for reference */
  googleUrl?: string;
}

// ─── Font registry ────────────────────────────────────────────

export const FONT_REGISTRY: FontInfo[] = [
  // ── Tamil fonts ──────────────────────────────────────────────
  {
    family:    'Noto Sans Tamil',
    label:     'Noto Sans Tamil',
    labelTa:   'நோட்டோ சான்ஸ் தமிழ்',
    script:    'tamil',
    category:  'sans-serif',
    sample:    'Tamil text',
    sampleTa:  'தமிழ் எழுத்து',
    cssVar:    '--font-noto-sans-tamil',
    weights:   [100, 200, 300, 400, 500, 600, 700, 800, 900],
    googleUrl: 'https://fonts.google.com/noto/specimen/Noto+Sans+Tamil',
  },
  {
    family:    'Noto Serif Tamil',
    label:     'Noto Serif Tamil',
    labelTa:   'நோட்டோ செரிஃப் தமிழ்',
    script:    'tamil',
    category:  'serif',
    sample:    'Tamil serif',
    sampleTa:  'தமிழ் செரிஃப்',
    cssVar:    '--font-noto-serif-tamil',
    weights:   [100, 200, 300, 400, 500, 600, 700, 800, 900],
    googleUrl: 'https://fonts.google.com/noto/specimen/Noto+Serif+Tamil',
  },
  {
    family:    'Catamaran',
    label:     'Catamaran',
    labelTa:   'கடமரான்',
    script:    'both',
    category:  'sans-serif',
    sample:    'Catamaran — clean',
    sampleTa:  'கடமரான் — தமிழ்',
    cssVar:    '--font-catamaran',
    weights:   [100, 200, 300, 400, 500, 600, 700, 800, 900],
    googleUrl: 'https://fonts.google.com/specimen/Catamaran',
  },
  {
    family:    'Baloo Thambi 2',
    label:     'Baloo Thambi 2',
    labelTa:   'பாலு தம்பி 2',
    script:    'both',
    category:  'display',
    sample:    'Display / headings',
    sampleTa:  'தலைப்பு எழுத்து',
    cssVar:    '--font-baloo-thambi',
    weights:   [400, 500, 600, 700, 800],
    googleUrl: 'https://fonts.google.com/specimen/Baloo+Thambi+2',
  },
  {
    family:    'Meera Inimai',
    label:     'Meera Inimai',
    labelTa:   'மீரா இனிமை',
    script:    'tamil',
    category:  'sans-serif',
    sample:    'Clean Tamil body',
    sampleTa:  'தெளிவான தமிழ்',
    cssVar:    '--font-meera-inimai',
    weights:   [400],
    googleUrl: 'https://fonts.google.com/specimen/Meera+Inimai',
  },
  {
    family:    'Mukta Malar',
    label:     'Mukta Malar',
    labelTa:   'முக்தா மலர்',
    script:    'both',
    category:  'sans-serif',
    sample:    'Multilingual',
    sampleTa:  'இரு மொழி',
    cssVar:    '--font-mukta-malar',
    weights:   [200, 300, 400, 500, 600, 700, 800],
    googleUrl: 'https://fonts.google.com/specimen/Mukta+Malar',
  },

  // ── Latin / general fonts ────────────────────────────────────
  {
    family:    'Inter',
    label:     'Inter',
    script:    'latin',
    category:  'sans-serif',
    sample:    'Modern & clean',
    weights:   [100, 200, 300, 400, 500, 600, 700, 800, 900],
    cssVar:    '--font-inter',
  },
  {
    family:    'Arial',
    label:     'Arial',
    script:    'latin',
    category:  'sans-serif',
    sample:    'Classic sans-serif',
    weights:   [400, 700],
  },
  {
    family:    'Georgia',
    label:     'Georgia',
    script:    'latin',
    category:  'serif',
    sample:    'Elegant serif',
    weights:   [400, 700],
  },
  {
    family:    'Times New Roman',
    label:     'Times New Roman',
    script:    'latin',
    category:  'serif',
    sample:    'Classic newspaper',
    weights:   [400, 700],
  },
  {
    family:    'Verdana',
    label:     'Verdana',
    script:    'latin',
    category:  'sans-serif',
    sample:    'High legibility',
    weights:   [400, 700],
  },
  {
    family:    'Impact',
    label:     'Impact',
    script:    'latin',
    category:  'display',
    sample:    'BOLD DISPLAY',
    weights:   [400],
  },
  {
    family:    'Courier New',
    label:     'Courier New',
    script:    'latin',
    category:  'monospace',
    sample:    'Monospace code',
    weights:   [400, 700],
  },
  {
    family:    'Comic Sans MS',
    label:     'Comic Sans MS',
    script:    'latin',
    category:  'handwriting',
    sample:    'Fun & friendly',
    weights:   [400, 700],
  },
];

// ─── Derived helpers ──────────────────────────────────────────

/** All font family names (for simple dropdowns) */
export const FONT_FAMILIES = FONT_REGISTRY.map((f) => f.family);

/** Fonts grouped by script */
export const TAMIL_FONTS  = FONT_REGISTRY.filter((f) => f.script === 'tamil' || f.script === 'both');
export const LATIN_FONTS  = FONT_REGISTRY.filter((f) => f.script === 'latin' || f.script === 'both');
export const BILINGUAL_FONTS = FONT_REGISTRY.filter((f) => f.script === 'both');

/** Look up font info by family name */
export function getFontInfo(family: string): FontInfo | undefined {
  return FONT_REGISTRY.find(
    (f) => f.family.toLowerCase() === family.toLowerCase(),
  );
}

// ─── Fabric font preloader ────────────────────────────────────

/** Fonts currently loading or loaded (cache) */
const loadedFonts = new Set<string>();
const loadingFonts = new Map<string, Promise<void>>();

/**
 * Ensure a font is loaded in document.fonts before Fabric renders.
 *
 * Fabric.js draws text on a <canvas>.  If the font bytes haven't been
 * downloaded yet, the browser silently falls back to the system default,
 * producing wrong widths and garbled Tamil clusters.
 *
 * This function:
 *  1. Checks the cache — returns immediately if already loaded
 *  2. Calls document.fonts.load() for 400, 700 weights
 *  3. Caches the result so repeat calls are instant
 */
export async function loadFont(family: string, weight = 400): Promise<void> {
  if (typeof document === 'undefined') return; // SSR guard

  const key = `${family}-${weight}`;
  if (loadedFonts.has(key)) return;

  if (loadingFonts.has(key)) {
    return loadingFonts.get(key)!;
  }

  const promise = (async () => {
    try {
      // Load both regular and bold weights for text editing
      const specs = [`${weight} 16px "${family}"`, `bold 16px "${family}"`];
      await Promise.allSettled(specs.map((s) => document.fonts.load(s)));
      loadedFonts.add(key);
    } catch (err) {
      console.warn(`[tamil-fonts] Could not load font "${family}":`, err);
    }
  })();

  loadingFonts.set(key, promise);
  await promise;
  loadingFonts.delete(key);
}

/**
 * Preload all Tamil fonts in background (call once on editor mount).
 * Non-blocking — uses requestIdleCallback if available.
 */
export function preloadTamilFonts(): void {
  if (typeof window === 'undefined') return;

  const schedule = (fn: () => void) =>
    'requestIdleCallback' in window
      ? (window as Window & typeof globalThis & { requestIdleCallback: (fn: () => void) => void }).requestIdleCallback(fn)
      : setTimeout(fn, 200);

  schedule(() => {
    TAMIL_FONTS.forEach(({ family, weights }) => {
      // Load the two most common weights: regular + bold
      const toLoad = weights.includes(700) ? [400, 700] : [weights[0]];
      toLoad.forEach((w) => void loadFont(family, w));
    });
  });
}

// ─── Tamil text snippets (for canvas placeholder text) ────────

export const TAMIL_SAMPLES: { label: string; text: string }[] = [
  { label: 'Business Name',   text: 'உங்கள் நிறுவனம்'        },
  { label: 'Tagline',         text: 'தரமான சேவை, நம்பிக்கை'  },
  { label: 'Offer',           text: '50% தள்ளுபடி இப்போதே!'  },
  { label: 'Contact',         text: 'தொடர்பு கொள்ளுங்கள்'   },
  { label: 'Welcome',         text: 'வரவேற்கிறோம்'            },
  { label: 'Product',         text: 'சிறந்த தரம் | குறைந்த விலை' },
  { label: 'Festival',        text: 'இனிய தீபாவளி நல்வாழ்த்துக்கள்' },
  { label: 'Opening',         text: 'கிளை திறப்பு விழா'       },
];
