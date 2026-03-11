'use client';

import { useState } from 'react';
import { AvatarDisplay } from '@/components/avatar/avatar-upload';
import {
  FOOTBALL_EXPERIENCE_LABELS,
  type FootballExperienceLevel,
} from '@/lib/profile/constants';
import { MapPin, Play } from 'lucide-react';
import { HighlightVideoDialog } from '@/components/video/highlight-video-dialog';

interface FeaturedHighlight {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  title: string;
  metadata: Record<string, unknown> | null;
}

interface ProfileHeroProps {
  fullName: string;
  username: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  jerseyNumber: number | null;
  experienceLevel: string;
  organizationName?: string | null;
  location?: string | null;
  featuredHighlight?: FeaturedHighlight;
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
  featuredHighlight,
}: ProfileHeroProps) {
  const [showVideoDialog, setShowVideoDialog] = useState(false);

  const expLabel =
    FOOTBALL_EXPERIENCE_LABELS[experienceLevel as FootballExperienceLevel] ||
    experienceLevel;

  const hasFeatured = !!featuredHighlight;

  return (
    <div className="relative overflow-hidden">
      {/* Cover / gradient background */}
      <div className="h-44 sm:h-56 md:h-64 relative">
        {hasFeatured && featuredHighlight.thumbnailUrl ? (
          // Featured highlight thumbnail as cover with play button
          <button
            onClick={() => setShowVideoDialog(true)}
            className="w-full h-full relative group cursor-pointer"
          >
            <img
              src={featuredHighlight.thumbnailUrl}
              alt={featuredHighlight.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/15 backdrop-blur-sm rounded-full p-4 transition-all duration-300 group-hover:bg-white/25 group-hover:scale-110">
                <Play className="h-8 w-8 text-white ml-0.5" />
              </div>
            </div>
            <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
              Featured Highlight
            </span>
          </button>
        ) : coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
        )}
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--night)] via-[var(--night)]/60 to-transparent pointer-events-none" />

        {/* Jersey number watermark */}
        {jerseyNumber && (
          <div className="absolute top-4 right-6 select-none pointer-events-none">
            <span className="text-[120px] sm:text-[160px] font-black leading-none text-white/[0.04] tracking-tighter">
              {jerseyNumber}
            </span>
          </div>
        )}
      </div>

      {/* Profile info — overlapping the cover */}
      <div className="px-6 md:px-8 pb-8 -mt-24 sm:-mt-20 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <AvatarDisplay
              avatarUrl={avatarUrl}
              fullName={fullName}
              size="4xl"
              className="ring-[3px] ring-[var(--night)] shadow-2xl"
            />
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 space-y-2 pb-1">
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none"
              style={{ color: 'var(--timberwolf)' }}
            >
              {fullName}
            </h1>
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--ash-grey)' }}
            >
              @{username}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-400/10 text-green-400 border border-green-400/20">
                {expLabel}
              </span>
              {jerseyNumber && (
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  #{jerseyNumber}
                </span>
              )}
              {organizationName && (
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
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

      {/* Featured Highlight Video Dialog */}
      {featuredHighlight && (
        <HighlightVideoDialog
          highlightId={featuredHighlight.id}
          videoUrl={featuredHighlight.videoUrl}
          thumbnail={featuredHighlight.thumbnailUrl}
          title={featuredHighlight.title}
          metadata={featuredHighlight.metadata}
          open={showVideoDialog}
          onOpenChange={setShowVideoDialog}
        />
      )}
    </div>
  );
}
