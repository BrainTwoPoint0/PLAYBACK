import type { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';

export const metadata: Metadata = {
  title: { absolute: 'PLAYBACK' },
  description:
    'PLAYBACK is the Operating System for Sports. AI match recordings, highlights, analytics, academy management, and player profiles for 75,000+ players across 25+ clubs in 10+ countries.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'PLAYBACK',
    description:
      'The Operating System for Sports. AI match recordings, highlights, analytics, academy management, and player profiles.',
  },
};

export default function HomePage() {
  return <HomeClient />;
}
