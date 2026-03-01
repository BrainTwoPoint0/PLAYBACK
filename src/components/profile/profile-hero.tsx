import { AvatarDisplay } from '@/components/avatar/avatar-upload';
import {
  FOOTBALL_EXPERIENCE_LABELS,
  type FootballExperienceLevel,
} from '@/lib/profile/constants';
import { MapPin } from 'lucide-react';

interface ProfileHeroProps {
  fullName: string;
  username: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  jerseyNumber: number | null;
  experienceLevel: string;
  organizationName?: string | null;
  location?: string | null;
}

export function ProfileHero({
  fullName,
  username,
  avatarUrl,
  coverImageUrl,
  jerseyNumber,
  experienceLevel,
  organizationName,
  location,
}: ProfileHeroProps) {
  const expLabel =
    FOOTBALL_EXPERIENCE_LABELS[experienceLevel as FootballExperienceLevel] ||
    experienceLevel;

  return (
    <div className="relative">
      {/* Cover / gradient background */}
      <div className="h-48 md:h-56 rounded-t-2xl overflow-hidden">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-900/40 via-neutral-900 to-blue-900/30" />
        )}
      </div>

      {/* Profile info overlay */}
      <div className="px-6 md:px-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-12">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <AvatarDisplay
              avatarUrl={avatarUrl}
              fullName={fullName}
              size="4xl"
              className="ring-4 ring-neutral-900"
            />
            {jerseyNumber && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                #{jerseyNumber}
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 space-y-1 pb-1">
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ color: 'var(--timberwolf)' }}
            >
              {fullName}
            </h1>
            <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              @{username}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/30">
                {expLabel}
              </span>
              {organizationName && (
                <span className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                  {organizationName}
                </span>
              )}
              {location && (
                <span
                  className="inline-flex items-center gap-1 text-xs"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
