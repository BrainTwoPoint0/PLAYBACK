import type { Metadata, Viewport } from 'next';
import { Inter, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { DirectionProvider } from '@radix-ui/react-direction';
import NextTopLoader from 'nextjs-toploader';
import '../globals.css';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { JsonLd } from '@/components/JsonLd';
import { AuthProvider } from '@braintwopoint0/playback-commons/auth';
import { GotchaProvider } from '@/components/GotchaProvider';
import { PostHogProvider } from '@/components/PostHogProvider';
import { routing } from '@/i18n/routing';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Includes latin so English brand/club/player names render consistently
// inside Arabic pages. Not a variable font — weights must be listed.
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://playbacksports.ai';

const OG_LOCALES: Record<string, string> = {
  en: 'en_GB',
  ar: 'ar_AE',
  es: 'es_ES',
};

const HTML_LANGS: Record<string, string> = {
  en: 'en-GB',
  ar: 'ar',
  es: 'es',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#0a100d',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: 'PLAYBACK',
      template: '%s | PLAYBACK',
    },
    description:
      'PLAYBACK is the Operating System for Sports. AI match recordings, highlights, analytics, and player profiles - for 75,000+ players across 25+ clubs in 10+ countries.',
    applicationName: 'PLAYBACK',
    authors: [{ name: 'PLAYBACK Sports Ltd' }],
    keywords: [
      'PLAYBACK',
      'sports technology',
      'AI match recording',
      'football highlights',
      'academy software',
      'player profile',
      'Veo',
      'Spiideo',
      'tournament broadcast',
      'youth football',
    ],
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: 'PLAYBACK',
      title: 'PLAYBACK',
      description:
        'The Operating System for Sports. AI match recordings, highlights, analytics, and player profiles - for 75,000+ players across 25+ clubs in 10+ countries.',
      url: '/',
      locale: OG_LOCALES[locale] ?? OG_LOCALES.en,
      images: [
        {
          url: '/hero/hero-poster.jpg',
          width: 1600,
          height: 900,
          alt: 'PLAYBACK - The Operating System for Sports',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@playbacksports',
      creator: '@playbacksports',
      title: 'PLAYBACK',
      description:
        'The Operating System for Sports. AI match recordings, highlights, analytics, and player profiles.',
      images: ['/hero/hero-poster.jpg'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${APP_URL}/#organization`,
  name: 'PLAYBACK',
  legalName: 'PLAYBACK Sports Ltd',
  alternateName: 'PLAYBACK Sports',
  url: APP_URL,
  logo: `${APP_URL}/branding/PLAYBACK-Icon.png`,
  description:
    'PLAYBACK is the Operating System for Sports - AI match recordings, highlights, analytics, and player profiles for clubs, academies, parents, and players.',
  slogan: 'The OS for Sports',
  foundingDate: '2024-04',
  foundingLocation: {
    '@type': 'Place',
    name: 'London, United Kingdom',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: '71-75 Shelton Street, Covent Garden',
    addressLocality: 'London',
    postalCode: 'WC2H 9JQ',
    addressCountry: 'GB',
  },
  identifier: [
    {
      '@type': 'PropertyValue',
      propertyID: 'UK Companies House',
      value: '15638660',
    },
  ],
  sameAs: [
    'https://www.linkedin.com/company/playbacksports/',
    'https://www.instagram.com/playback_global',
    'https://www.tiktok.com/@playback_global',
    'https://x.com/playbacksports',
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${APP_URL}/#contact`,
      availableLanguage: ['English', 'Arabic', 'Spanish'],
    },
  ],
  knowsAbout: [
    'sports technology',
    'AI match recording',
    'football highlights',
    'academy management',
    'tournament broadcast',
    'player development',
    'sports analytics',
  ],
  areaServed: 'Worldwide',
};

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${APP_URL}/#software`,
  name: 'PLAYBACK',
  url: APP_URL,
  description:
    'AI match recordings, highlights, analytics, and player profiles for clubs, academies, and players.',
  applicationCategory: 'SportsApplication',
  applicationSubCategory: 'Sports Technology Platform',
  operatingSystem: 'Web, iOS, Android',
  publisher: { '@id': `${APP_URL}/#organization` },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'GBP',
    availability: 'https://schema.org/InStock',
  },
  featureList: [
    'AI match recording',
    'Automated highlights',
    'Academy subscription management',
    'Tournament broadcast',
    'Court and pitch booking aggregation',
    'Player profiles',
  ],
};

function websiteSchema(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${APP_URL}/#website`,
    name: 'PLAYBACK',
    alternateName: 'PLAYBACK Sports',
    url: APP_URL,
    description: 'The Operating System for Sports.',
    publisher: { '@id': `${APP_URL}/#organization` },
    inLanguage: HTML_LANGS[locale] ?? HTML_LANGS.en,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${APP_URL}/playscanner?city={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Enables static rendering for pages below this layout despite the
  // [locale] dynamic param.
  setRequestLocale(locale);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const font = locale === 'ar' ? plexArabic : inter;

  return (
    <html
      lang={HTML_LANGS[locale] ?? locale}
      dir={dir}
      className={font.variable}
    >
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema(locale)} />
        <JsonLd data={softwareApplicationSchema} />
      </head>
      <body className="font-sans">
        <NextTopLoader
          color="#d6d5c9"
          height={2}
          showSpinner={false}
          shadow="0 0 10px #d6d5c9,0 0 5px #d6d5c9"
        />
        <NextIntlClientProvider>
          <DirectionProvider dir={dir}>
            <AuthProvider>
              <PostHogProvider>
                <GotchaProvider>
                  <NavBar />
                  {children}
                  <Footer />
                </GotchaProvider>
              </PostHogProvider>
            </AuthProvider>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
