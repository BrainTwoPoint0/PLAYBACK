import type { Metadata } from 'next';
import { ProfilePage } from '@/components/profile/profile-page';
import { getPublicProfile } from '@/lib/profile/get-public-profile';

interface PageProps {
  // The dynamic segment is named [module] on disk to match the URL shape
  // /p/<slug>/<module-slug>; rename at destructure time to avoid shadowing
  // JS's `module` global.
  params: Promise<{ slug: string; module: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, module: moduleSlug } = await params;
  const data = await getPublicProfile(slug, moduleSlug);
  if (!data || data === 'module-not-found') {
    return { title: 'Profile Not Found' };
  }
  const { profile, activeVariant } = data;
  const moduleLabel =
    activeVariant.display_name ??
    activeVariant.sport_name ??
    activeVariant.variant_type;
  const title = `${profile.full_name ?? profile.username} · ${moduleLabel}`;
  const description = activeVariant.variant_bio
    ? activeVariant.variant_bio.slice(0, 160)
    : profile.bio
      ? profile.bio.slice(0, 160)
      : `${profile.full_name ?? profile.username}'s ${moduleLabel} profile on PLAYBACK Sports`;
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

export default async function PublicProfileModulePage({ params }: PageProps) {
  const { slug, module: moduleSlug } = await params;
  return <ProfilePage slug={slug} moduleSlug={moduleSlug} />;
}
