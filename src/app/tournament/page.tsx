import type { Metadata } from 'next';
import TournamentClient from '@/components/TournamentClient';

export const metadata: Metadata = {
  title: 'PLAYBACK Tournament — Broadcast & Competition Management',
  description:
    'Run tournaments on PLAYBACK. Broadcast every match, manage fixtures and registrations, and deliver recordings to every player and parent. Trusted by youth and grassroots competitions worldwide.',
  alternates: { canonical: '/tournament' },
  keywords: [
    'tournament software',
    'football tournament broadcast',
    'youth football competitions',
    'tournament management',
    'fixtures and registrations',
    'tournament streaming',
  ],
  openGraph: {
    type: 'website',
    url: '/tournament',
    title: 'PLAYBACK Tournament — Broadcast & Competition Management',
    description:
      'Broadcast every match, manage fixtures, and deliver recordings to every player and parent.',
  },
};

export default function TournamentPage() {
  return <TournamentClient />;
}
