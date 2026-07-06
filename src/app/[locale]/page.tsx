import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import HomeClient from '@/components/HomeClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing.header' });
  return {
    title: { absolute: 'PLAYBACK' },
    description: t('metaDescription'),
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      url: '/',
      title: 'PLAYBACK',
      description: t('ogDescription'),
    },
  };
}

export default function HomePage() {
  return <HomeClient />;
}
