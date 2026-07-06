import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ProfileHero } from '@/components/profile/profile-hero';
import { ProfileAbout } from '@/components/profile/profile-about';
import { ProfileKeyInfo } from '@/components/profile/profile-key-info';
import { ProfilePositions } from '@/components/profile/profile-positions';
import { ProfileHighlights } from '@/components/profile/profile-highlights';
import { AttributedClips } from '@/components/profile/attributed-clips';
import { ProfileStats } from '@/components/profile/profile-stats';
import { ProfileCareer } from '@/components/profile/profile-career';
import { ProfileEducation } from '@/components/profile/profile-education';
import { ProfileModuleSwitcher } from '@/components/profile/profile-module-switcher';
import { VerifiedBadge } from '@/components/profile/verified-badge';
import { ProfileLayout } from '@/app/[locale]/p/[slug]/profile-layout';
import { getPublicProfile } from '@/lib/profile/get-public-profile';

interface ProfilePageProps {
  slug: string;
  moduleSlug?: string;
}

/**
 * Shared server-render for /p/[slug] and /p/[slug]/[module]. Resolves the
 * active variant via the connective-tissue layer (profile_module_privacies +
 * profile_variants.module_slug), then renders the existing presentational
 * components. The module switcher is rendered when the profile has 2+ public
 * modules; the verified-badge stacks all non-revoked profile_verifications.
 */
export async function ProfilePage({ slug, moduleSlug }: ProfilePageProps) {
  const data = await getPublicProfile(slug, moduleSlug);
  if (!data || data === 'module-not-found') notFound();

  const {
    profile,
    publicVariants,
    activeVariant,
    football,
    coach,
    verifications,
    highlights,
    featuredHighlight,
    attributedClips,
    stats,
    career,
    education,
    organizationName,
  } = data;

  const isPlayer = activeVariant.variant_type === 'player';
  const isCoach = activeVariant.variant_type === 'coach';

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: 'var(--night)' }}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--timberwolf) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto pb-20">
        <ProfileLayout delay={0}>
          <ProfileHero
            fullName={profile.full_name || profile.username}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            coverImageUrl={profile.cover_image_url}
            jerseyNumber={
              isPlayer ? (football?.preferred_jersey_number ?? null) : null
            }
            experienceLevel={isPlayer ? (football?.experience_level ?? '') : ''}
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

        {(verifications.length > 0 || publicVariants.length > 1) && (
          <div className="mt-8 px-4 md:px-0 flex flex-wrap items-center gap-3">
            {verifications.length > 0 && (
              <VerifiedBadge verifications={verifications} />
            )}
            <ProfileModuleSwitcher
              username={profile.username}
              variants={publicVariants}
              activeModuleSlug={activeVariant.module_slug}
            />
          </div>
        )}

        <div className="mt-8 px-4 md:px-0 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ProfileLayout delay={100}>
              <ProfileAbout
                bio={activeVariant.variant_bio || profile.bio}
                socialLinks={null}
              />
            </ProfileLayout>

            {isPlayer && football && (
              <>
                <ProfileLayout delay={150}>
                  <ProfileKeyInfo
                    preferredFoot={football.preferred_foot}
                    heightCm={profile.height_cm}
                    weightKg={profile.weight_kg}
                    dateOfBirth={null}
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
              </>
            )}

            {isCoach && coach && (
              <ProfileLayout delay={150}>
                <CoachSummary
                  ageGroups={coach.age_groups}
                  philosophy={coach.coaching_philosophy}
                />
              </ProfileLayout>
            )}

            {career.length > 0 && (
              <ProfileLayout delay={250}>
                <ProfileCareer entries={career as any} />
              </ProfileLayout>
            )}

            {education.length > 0 && (
              <ProfileLayout delay={300}>
                <ProfileEducation entries={education as any} />
              </ProfileLayout>
            )}
          </div>

          <div className="lg:col-span-3 space-y-8">
            {attributedClips.length > 0 && (
              <ProfileLayout delay={150}>
                <AttributedClips clips={attributedClips} />
              </ProfileLayout>
            )}

            {/* Legacy highlights — kept for users who imported via the
                pull-based flow before the connective-tissue layer landed.
                When attributed clips exist they are the canonical surface;
                we hide legacy highlights to avoid visual duplication of
                the same recordings under two headings. v1.1: full removal. */}
            {attributedClips.length === 0 && highlights.length > 0 && (
              <ProfileLayout delay={150}>
                <ProfileHighlights highlights={highlights} />
              </ProfileLayout>
            )}

            <ProfileLayout delay={250}>
              <ProfileStats stats={stats as any} />
            </ProfileLayout>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoachSummary({
  ageGroups,
  philosophy,
}: {
  ageGroups: string[];
  philosophy: string | null;
}) {
  const t = useTranslations('profile.coaching');
  return (
    <div className="rounded-xl border border-[var(--timberwolf)]/20 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-[var(--timberwolf)]">
        {t('title')}
      </h2>
      {ageGroups.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--ash-grey)] mb-2">
            {t('ageGroups')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ageGroups.map((g) => (
              <span
                key={g}
                className="px-2.5 py-1 text-xs rounded-full bg-[var(--timberwolf)]/5 text-[var(--timberwolf)] border border-[var(--timberwolf)]/20"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      )}
      {philosophy && (
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--ash-grey)] mb-2">
            {t('philosophy')}
          </div>
          <p className="text-sm text-[var(--timberwolf)]/90 whitespace-pre-line">
            {philosophy}
          </p>
        </div>
      )}
    </div>
  );
}
