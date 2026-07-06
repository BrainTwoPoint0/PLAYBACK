import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ar', 'es'],
  defaultLocale: 'en',
  // English URLs stay unprefixed (/dashboard); other locales get a prefix
  // (/ar/dashboard)
  localePrefix: 'as-needed',
  // Language is opt-in via the NavBar switcher — with detection on, every
  // Arabic-Accept-Language browser would be 307'd off the canonical English
  // URLs. Standing decision from the PLAYHUB launch; Karim will ask if he
  // wants it flipped.
  localeDetection: false,
  // Persist the chosen locale for a year (default cookie is session-scoped).
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
  // Do NOT add `domains` here without re-reviewing middleware.ts: domain
  // routing unlocks next-intl's cross-host redirects, and the middleware
  // replays refreshed Supabase auth cookies onto every response it returns.
});

export type Locale = (typeof routing.locales)[number];
