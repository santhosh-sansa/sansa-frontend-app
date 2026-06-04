'use client';

/**
 * SANSA AI — Analytics Integration
 * Google Analytics 4 + PostHog
 * 
 * Setup:
 * 1. Set NEXT_PUBLIC_GA_ID in env (e.g., G-XXXXXXXXXX)
 * 2. Set NEXT_PUBLIC_POSTHOG_KEY in env
 * 3. Set NEXT_PUBLIC_POSTHOG_HOST (default: https://app.posthog.com)
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// ─── Google Analytics 4 ───────────────────────────────────────

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      identify: (id: string, properties?: Record<string, unknown>) => void;
      reset: () => void;
      people?: { set: (props: Record<string, unknown>) => void };
    };
  }
}

export function initGA() {
  if (!GA_ID || typeof window === 'undefined') return;

  // Load gtag script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
}

export function trackPageView(url: string) {
  if (!GA_ID || !window.gtag) return;
  window.gtag('config', GA_ID, { page_path: url });
}

export function trackGAEvent(action: string, category: string, label?: string, value?: number) {
  if (!window.gtag) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
}

// ─── PostHog ──────────────────────────────────────────────────

export function initPostHog() {
  if (!POSTHOG_KEY || typeof window === 'undefined') return;

  // Load PostHog script
  const script = document.createElement('script');
  script.innerHTML = `
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('${POSTHOG_KEY}', {api_host: '${POSTHOG_HOST}', autocapture: true, capture_pageview: true});
  `;
  document.head.appendChild(script);
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  // PostHog
  if (window.posthog) {
    window.posthog.identify(userId, properties);
  }
  // GA4
  if (window.gtag) {
    window.gtag('set', { user_id: userId });
  }
}

export function resetAnalytics() {
  if (window.posthog) window.posthog.reset();
}

// ─── Unified Track Function ───────────────────────────────────

export function track(event: string, properties?: Record<string, unknown>) {
  // PostHog
  if (window.posthog) {
    window.posthog.capture(event, properties);
  }
  // GA4
  if (window.gtag) {
    window.gtag('event', event, properties);
  }
}

// ─── Pre-defined Events ───────────────────────────────────────

export const analytics = {
  // Auth events
  signup: (method: string) => track('user_signup', { method }),
  login: (method: string) => track('user_login', { method }),
  logout: () => track('user_logout'),

  // Feature usage
  featureUsed: (feature: string, details?: Record<string, unknown>) =>
    track('feature_used', { feature, ...details }),

  // AI usage
  aiGenerate: (tool: string, credits: number) =>
    track('ai_generate', { tool, credits }),
  aiChat: (model: string) =>
    track('ai_chat_message', { model }),

  // Editor usage
  editorOpen: (editor: string) =>
    track('editor_opened', { editor }),
  editorExport: (editor: string, format: string) =>
    track('editor_export', { editor, format }),

  // Billing
  creditsPurchased: (amount: number, packageId: string) =>
    track('credits_purchased', { amount, packageId }),
  planUpgrade: (from: string, to: string) =>
    track('plan_upgrade', { from_plan: from, to_plan: to }),

  // Engagement
  pageView: (page: string) => {
    trackPageView(page);
    track('page_view', { page });
  },
  search: (query: string) => track('search', { query }),
  commandPalette: () => track('command_palette_opened'),
};
