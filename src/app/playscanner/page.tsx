import { Metadata } from 'next';
import PLAYScannerMain from '@/components/playscanner/PLAYScannerMain';
import { ContactForm } from '@/components/Contact';

export const metadata: Metadata = {
  title: 'PLAYScanner - Book Sports Courts & Pitches | PLAYBACK',
  description:
    'Find and book padel courts and football pitches across multiple providers. Compare prices, availability, and book instantly.',
  keywords: [
    'padel booking',
    'football booking',
    'sports courts',
    'pitch booking',
    'PLAYBACK',
  ],
};

export default function PLAYScannerPage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <PLAYScannerMain />
      <ContactForm />
    </main>
  );
}
