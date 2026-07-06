import type { Metadata } from 'next';
import AcademyClient from '@/components/AcademyClient';

export const metadata: Metadata = {
  title: 'PLAYBACK Academy — Subscription & Member Management for Clubs',
  description:
    'Run your academy on PLAYBACK. Subscription billing, member access, recording delivery, and player development tools for football clubs and academies. Used by 25+ clubs across 10+ countries.',
  alternates: { canonical: '/academy' },
  keywords: [
    'football academy software',
    'club subscription management',
    'academy billing',
    'youth football platform',
    'player development',
    'club management',
  ],
  openGraph: {
    type: 'website',
    url: '/academy',
    title: 'PLAYBACK Academy — Subscription & Member Management for Clubs',
    description:
      'Subscription billing, member access, and recording delivery for football clubs and academies.',
  },
};

export default function AcademyPage() {
  return <AcademyClient />;
}
