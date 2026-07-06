import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AcademyClient from '@/components/AcademyClient';

// Static page (client wrapper) — pass the explicit locale to getTranslations
// so metadata resolves without opting the route into dynamic rendering.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'academy.meta' });
  return {
    title: t('title'),
    description: t('description'),
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
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  };
}

export default function AcademyPage() {
  return <AcademyClient />;
}
