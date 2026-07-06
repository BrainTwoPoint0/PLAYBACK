import { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import PLAYScannerMain from '@/components/playscanner/PLAYScannerMain';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'playscanner.meta' });

  return {
    title: t('title'),
    description: t('description'),
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
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  };
}

export default function PLAYScannerPage() {
  return (
    <main className="min-h-screen bg-night">
      <Suspense>
        <PLAYScannerMain />
      </Suspense>
    </main>
  );
}
