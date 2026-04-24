import { Metadata } from 'next';
import { Suspense } from 'react';
import PLAYScannerMain from '@/components/playscanner/PLAYScannerMain';

export const metadata: Metadata = {
  title: 'PLAYSCANNER — Book Sports Courts & Pitches',
  description:
    'Find and book football pitches, padel courts, basketball courts, and tennis courts across London. Compare prices in real time across providers including Playtomic, MATCHi, and Padel Mates.',
  alternates: { canonical: '/playscanner' },
  keywords: [
    'football booking',
    'padel booking',
    'basketball booking',
    'tennis booking',
    'sports courts london',
    'pitch booking',
    'court booking aggregator',
  ],
  openGraph: {
    type: 'website',
    url: '/playscanner',
    title: 'PLAYSCANNER — Book Sports Courts & Pitches',
    description:
      'Aggregated court and pitch booking across providers. Compare prices in real time.',
  },
};

export default function PLAYScannerPage() {
  return (
    <main className="min-h-screen bg-night">
      <Suspense>
        <PLAYScannerMain />
      </Suspense>
    </main>
  );
}
