import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProfilePage } from '@/components/profile/profile-page';
import { getPublicProfile } from '@/lib/profile/get-public-profile';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'profile.meta' });
  const data = await getPublicProfile(slug);
  if (!data || data === 'module-not-found') {
    return { title: t('notFound') };
  }
  const { profile } = data;
  const title = profile.full_name ?? profile.username;
  const description = profile.bio
    ? profile.bio.slice(0, 160)
    : t('profileDescription', { name: title });
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      ...(profile.avatar_url && { images: [profile.avatar_url] }),
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  return <ProfilePage slug={slug} />;
}
