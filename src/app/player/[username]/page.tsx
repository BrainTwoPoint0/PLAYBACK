import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileHero } from '@/components/profile/profile-hero';
import { ProfileAbout } from '@/components/profile/profile-about';
import { ProfileKeyInfo } from '@/components/profile/profile-key-info';
import { ProfilePositions } from '@/components/profile/profile-positions';
import { ProfileHighlights } from '@/components/profile/profile-highlights';
import { ProfileStats } from '@/components/profile/profile-stats';
import { ProfileCareer } from '@/components/profile/profile-career';
import { ProfileEducation } from '@/components/profile/profile-education';
import { ProfileLayout } from './profile-layout';
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

  // Fetch career history
  const { data: career } = await supabase
    .from('career_history')
    .select(
      'id, organization_name, role, start_date, end_date, is_current, description'
    )
    .eq('profile_variant_id', typedVariant.id)
    .order('display_order', { ascending: true });

  // Fetch education
  const { data: education } = await supabase
    .from('education')
    .select(
      'id, institution_name, institution_type, degree_or_program, field_of_study, start_date, end_date, is_current, description'
    )
    .eq('profile_id', typedProfile.id)
    .order('display_order', { ascending: true });

  const typedHighlights = (highlights || []).map((h: any) => ({
    ...h,
    metadata: (h.metadata as Record<string, unknown>) || null,
  }));

  // Featured highlight = most recent public highlight (first in the list)
  const featuredHighlight =
    typedHighlights.length > 0 ? typedHighlights[0] : null;

  return {
    profile: typedProfile,
    variant: typedVariant,
    football: typedFootball,
    highlights: typedHighlights,
    featuredHighlight,
    career: (career || []) as any[],
    education: (education || []) as any[],
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

  const {
    profile,
    football,
    highlights,
    featuredHighlight,
    career,
    education,
    stats,
  } = data;

  // Get current team from career history for the hero
  const currentTeam = career.find((c: any) => c.is_current);
  const organizationName = currentTeam?.organization_name || null;

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: 'var(--night)' }}
    >
      {/* Subtle dot pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--timberwolf) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto pb-20">
        {/* Hero — full width, no card wrapper */}
        <ProfileLayout delay={0}>
          <ProfileHero
            fullName={profile.full_name || username}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            coverImageUrl={profile.cover_image_url}
            jerseyNumber={football.preferred_jersey_number}
            experienceLevel={football.experience_level}
            organizationName={organizationName}
            location={profile.location}
            featuredHighlight={
              featuredHighlight
                ? {
                    id: featuredHighlight.id,
                    videoUrl: featuredHighlight.video_url,
                    thumbnailUrl: featuredHighlight.thumbnail_url,
                    title: featuredHighlight.title,
                    metadata: featuredHighlight.metadata,
                  }
                : undefined
            }
          />
        </ProfileLayout>

        {/* Content — two-column on desktop */}
        <div className="mt-8 px-4 md:px-0 grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column — info */}
          <div className="lg:col-span-2 space-y-8">
            <ProfileLayout delay={100}>
              <ProfileAbout
                bio={profile.bio}
                socialLinks={
                  profile.social_links as Record<string, string> | null
                }
              />
            </ProfileLayout>

            <ProfileLayout delay={150}>
              <ProfileKeyInfo
                preferredFoot={football.preferred_foot}
                heightCm={profile.height_cm}
                weightKg={profile.weight_kg}
                dateOfBirth={profile.date_of_birth}
                experienceLevel={football.experience_level}
                jerseyNumber={football.preferred_jersey_number}
                primaryPosition={football.primary_position}
              />
            </ProfileLayout>

            <ProfileLayout delay={200}>
              <ProfilePositions
                primaryPosition={football.primary_position}
                secondaryPositions={football.secondary_positions}
              />
            </ProfileLayout>

            {career.length > 0 && (
              <ProfileLayout delay={250}>
                <ProfileCareer entries={career} />
              </ProfileLayout>
            )}

            {education.length > 0 && (
              <ProfileLayout delay={300}>
                <ProfileEducation entries={education} />
              </ProfileLayout>
            )}
          </div>

          {/* Right column — highlights + stats */}
          <div className="lg:col-span-3 space-y-8">
            <ProfileLayout delay={150}>
              <ProfileHighlights highlights={highlights} />
            </ProfileLayout>

            <ProfileLayout delay={250}>
              <ProfileStats
                stats={stats.map((s) => ({
                  ...s,
                  metrics: s.metrics as Record<string, unknown>,
                }))}
              />
            </ProfileLayout>
          </div>
        </div>
      </div>
    </div>
  );
}
