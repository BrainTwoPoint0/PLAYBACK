import { Metadata } from 'next';
import { Suspense } from 'react';
import PLAYScannerMain from '@/components/playscanner/PLAYScannerMain';
import { ContactForm } from '@/components/Contact';

export const metadata: Metadata = {
  title: 'PLAYSCANNER - Book Sports Courts & Pitches | PLAYBACK',
  description:
    'Find and book football pitches, padel courts, basketball courts, and tennis courts across London. Compare prices from 10+ providers.',
  keywords: [
    'football booking',
    'padel booking',
    'basketball booking',
    'tennis booking',
    'sports courts london',
    'pitch booking',
  ],
};

export default function PLAYScannerPage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Suspense>
        <PLAYScannerMain />
      </Suspense>
      <ContactForm />
    </main>
  );
}
