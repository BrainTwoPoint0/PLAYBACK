import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@braintwopoint0/playback-commons/auth';
import { GotchaProvider } from '@/components/GotchaProvider';
import { PostHogProvider } from '@/components/PostHogProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://playbacksports.ai';

export const viewport: Viewport = {
  themeColor: '#0a100d',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'PLAYBACK - The OS for Sports',
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
    title: 'PLAYBACK - The OS for Sports',
    description:
      'The Operating System for Sports. AI match recordings, highlights, analytics, and player profiles - for 75,000+ players across 25+ clubs in 10+ countries.',
    url: '/',
    locale: 'en_GB',
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
    title: 'PLAYBACK - The OS for Sports',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
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
      <body className="font-sans">
        <NextTopLoader
          color="#d6d5c9"
          height={2}
          showSpinner={false}
          shadow="0 0 10px #d6d5c9,0 0 5px #d6d5c9"
        />
        <AuthProvider>
          <PostHogProvider>
            <GotchaProvider>
              <NavBar />
              {children}
              <Footer />
            </GotchaProvider>
          </PostHogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
