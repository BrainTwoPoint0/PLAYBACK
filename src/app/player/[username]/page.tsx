import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileHero } from '@/components/profile/profile-hero';
import { ProfileAbout } from '@/components/profile/profile-about';
import { ProfileKeyInfo } from '@/components/profile/profile-key-info';
import { ProfilePositions } from '@/components/profile/profile-positions';
import { ProfileHighlights } from '@/components/profile/profile-highlights';
import { ProfileStats } from '@/components/profile/profile-stats';
import type { Tables } from '@/lib/supabase/types';
import type { Metadata } from 'next';

type Profile = Tables<'profiles'>;
type ProfileVariant = Tables<'profile_variants'>;
type FootballProfile = Tables<'football_player_profiles'>;
type Highlight = Tables<'highlights'>;
type Stat = Tables<'statistics'>;

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getPlayerProfile(username: string) {
  const supabase = await createClient();

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (profileError || !profile) return null;

  const typedProfile = profile as unknown as Profile;

  // Fetch player variant
  const { data: variant } = await supabase
    .from('profile_variants')
    .select('*')
    .eq('profile_id', typedProfile.id)
    .eq('variant_type', 'player')
    .eq('is_active', true)
    .single();

  if (!variant) return null;

  const typedVariant = variant as unknown as ProfileVariant;

  // Fetch football profile
  const { data: football } = await supabase
    .from('football_player_profiles')
    .select('*')
    .eq('profile_variant_id', typedVariant.id)
    .single();

  if (!football) return null;

  const typedFootball = football as unknown as FootballProfile;

  // Fetch highlights
  const { data: highlights } = await supabase
    .from('highlights')
    .select(
      'id, title, thumbnail_url, video_url, duration, view_count, metadata'
    )
    .eq('profile_variant_id', typedVariant.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(6);

  // Fetch stats
  const { data: stats } = await supabase
    .from('statistics')
    .select('id, stat_type, stat_date, metrics, competition, opponent')
    .eq('profile_variant_id', typedVariant.id)
    .order('stat_date', { ascending: false })
    .limit(10);

  return {
    profile: typedProfile,
    variant: typedVariant,
    football: typedFootball,
    highlights: (highlights || []).map((h: any) => ({
      ...h,
      metadata: (h.metadata as Record<string, unknown>) || null,
    })),
    stats: (stats || []) as unknown as Pick<
      Stat,
      'id' | 'stat_type' | 'stat_date' | 'metrics' | 'competition' | 'opponent'
    >[],
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await getPlayerProfile(username);

  if (!data) {
    return { title: 'Player Not Found | PLAYBACK' };
  }

  const { profile } = data;
  const title = `${profile.full_name} | Player Profile | PLAYBACK`;
  const description = profile.bio
    ? profile.bio.slice(0, 160)
    : `${profile.full_name}'s football player profile on PLAYBACK Sports`;

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

export default async function PlayerProfilePage({ params }: PageProps) {
  const { username } = await params;
  const data = await getPlayerProfile(username);

  if (!data) {
    notFound();
  }

  const { profile, football, highlights, stats } = data;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
      <div className="max-w-3xl mx-auto pb-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 border border-neutral-700/50 rounded-2xl overflow-hidden">
          <ProfileHero
            fullName={profile.full_name || username}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            coverImageUrl={profile.cover_image_url}
            jerseyNumber={football.preferred_jersey_number}
            experienceLevel={football.experience_level}
            location={profile.location}
          />
        </div>

        {/* Content sections */}
        <div className="mt-6 space-y-6 px-4 md:px-0">
          {/* About */}
          <Section>
            <ProfileAbout
              bio={profile.bio}
              socialLinks={
                profile.social_links as Record<string, string> | null
              }
            />
          </Section>

          {/* Key Info */}
          <Section>
            <ProfileKeyInfo
              preferredFoot={football.preferred_foot}
              heightCm={profile.height_cm}
              weightKg={profile.weight_kg}
              dateOfBirth={profile.date_of_birth}
              experienceLevel={football.experience_level}
              jerseyNumber={football.preferred_jersey_number}
              primaryPosition={football.primary_position}
            />
          </Section>

          {/* Positions */}
          <Section>
            <ProfilePositions
              primaryPosition={football.primary_position}
              secondaryPositions={football.secondary_positions}
            />
          </Section>

          {/* Highlights */}
          <Section>
            <ProfileHighlights highlights={highlights} />
          </Section>

          {/* Stats */}
          <Section>
            <ProfileStats
              stats={stats.map((s) => ({
                ...s,
                metrics: s.metrics as Record<string, unknown>,
              }))}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 border border-neutral-700/50 rounded-2xl p-6">
      {children}
    </div>
  );
}
