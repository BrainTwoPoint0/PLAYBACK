import type { Metadata } from 'next';
import { ProfilePage } from '@/components/profile/profile-page';
import { getPublicProfile } from '@/lib/profile/get-public-profile';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicProfile(slug);
  if (!data || data === 'module-not-found') {
    return { title: 'Profile Not Found' };
  }
  const { profile } = data;
  const title = profile.full_name ?? profile.username;
  const description = profile.bio
    ? profile.bio.slice(0, 160)
    : `${profile.full_name ?? profile.username}'s profile on PLAYBACK Sports`;
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
