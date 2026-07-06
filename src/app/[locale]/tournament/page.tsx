import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import TournamentClient from '@/components/TournamentClient';

// Static page (client wrapper) — pass the explicit locale to getTranslations
// so metadata resolves without opting the route into dynamic rendering.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tournament.meta' });
  return {
    title: t('title'),
    description: t('description'),
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
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  };
}

export default function TournamentPage() {
  return <TournamentClient />;
}
