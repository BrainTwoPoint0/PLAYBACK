'use client';

import Link from 'next/link';
import {
  Play,
  Trophy,
  Shield,
  Sparkles,
  Wrench,
  Dumbbell,
  Film,
  ArrowUpRight,
  Share2,
} from 'lucide-react';
import { useState } from 'react';
import { ShareClipModal } from '@/components/profile/share-clip-modal';

export type ClipType =
  | 'goal'
  | 'assist'
  | 'save'
  | 'tackle'
  | 'skill'
  | 'custom';

export interface MatchClip {
  attributionId: string;
  type: ClipType;
  title: string | null;
  /** Drives the NEW pulse dot on the chip when newer than lastSeenAt. */
  attributedAt?: string;
}

export interface MatchGroupCardProps {
  recordingId: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  thumbnailUrl: string | null;
  ownerOrgName: string | null;
  clips: MatchClip[];
  /** PLAYHUB host for the watch deep-link. Falls back to prod if unset. */
  playhubBaseUrl?: string;
  /**
   * The user's last_dashboard_view_at. Any clip with `attributedAt` after
   * this is rendered with a NEW pulse. Null = never opened → first paint
   * marks everything new (intended day-1 behaviour).
   */
  lastSeenAt?: string | null;
}

const TYPE_CONFIG: Record<
  ClipType,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  goal: { label: 'Goal', Icon: Trophy },
  assist: { label: 'Assist', Icon: Sparkles },
  save: { label: 'Save', Icon: Shield },
  tackle: { label: 'Tackle', Icon: Wrench },
  skill: { label: 'Skill', Icon: Dumbbell },
  custom: { label: 'Clip', Icon: Film },
};

function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year:
        d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return iso;
  }
}

/**
 * The Veo-style match block — single recording, big thumbnail, clip-moment
 * chips inline. Whole thumbnail is a "watch the match" link to PLAYHUB; each
 * chip is the same destination for now (clip-level deep linking is v1.2 once
 * the player supports `?start=…`).
 *
 * Branded fallback (no thumbnail) is intentionally sport-themed — dotted
 * gradient + film glyph + "MATCH RECORDING" label — so it reads as a poster
 * placeholder, not a missing asset.
 */
export function MatchGroupCard({
  recordingId,
  homeTeam,
  awayTeam,
  matchDate,
  thumbnailUrl,
  ownerOrgName,
  clips,
  playhubBaseUrl,
  lastSeenAt,
}: MatchGroupCardProps) {
  const playhub =
    playhubBaseUrl ??
    process.env.NEXT_PUBLIC_PLAYHUB_URL?.replace(/\/$/, '') ??
    'https://playhub.playbacksports.ai';
  const watchUrl = `${playhub}/watch/${recordingId}?from=dashboard`;
  const [shareClip, setShareClip] = useState<MatchClip | null>(null);

  const lastSeenMs = lastSeenAt ? new Date(lastSeenAt).getTime() : null;
  const newClips = clips.filter((c) => isNew(c.attributedAt, lastSeenMs));
  const hasAnyNew = newClips.length > 0;
  const monogram =
    (ownerOrgName ?? homeTeam ?? 'M').trim().charAt(0).toUpperCase() || 'M';

  return (
    <article
      className="group rounded-2xl overflow-hidden border transition-all motion-reduce:transition-none hover:-translate-y-0.5"
      style={{
        backgroundColor: 'var(--surface-1)',
        borderColor: 'var(--line)',
      }}
    >
      <Link
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Watch full match: ${homeTeam} vs ${awayTeam}${
          hasAnyNew
            ? `, ${newClips.length} new clip${newClips.length === 1 ? '' : 's'}`
            : ''
        }`}
        className="block relative aspect-video overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--timberwolf)]/50"
        style={{ backgroundColor: 'var(--surface-2)' }}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={`${homeTeam} vs ${awayTeam}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        ) : (
          <BrandedThumbnailFallback monogram={monogram} />
        )}

        {/* Overlay gradients lift legibility on bright thumbnails */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[rgba(10,16,13,0.55)] to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(10,16,13,0.85)] to-transparent pointer-events-none" />

        {/* Top-left: club/source badge */}
        {ownerOrgName && (
          <div
            className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(10,16,13,0.6)',
              color: 'var(--timberwolf)',
              boxShadow: 'inset 0 0 0 1px rgba(214,213,201,0.12)',
            }}
          >
            {ownerOrgName}
          </div>
        )}

        {/* Top-right: moment count pill — when there are fresh arrivals the
            pill grows a leading pulse dot. Single visual element, balanced
            with the org badge on the left. NEW count is folded into the
            wrapping link's aria-label above; this pulse is decorative and
            aria-hidden so screen readers don't double-announce. */}
        <div
          className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium tabular-nums backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(10,16,13,0.6)',
            color: 'var(--timberwolf)',
            boxShadow: 'inset 0 0 0 1px rgba(214,213,201,0.12)',
          }}
        >
          {hasAnyNew && (
            <span
              aria-hidden
              className="relative inline-flex items-center justify-center"
            >
              <span
                className="absolute inline-flex h-2 w-2 rounded-full opacity-60 animate-ping motion-reduce:animate-none"
                style={{ backgroundColor: 'var(--timberwolf)' }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: 'var(--timberwolf)' }}
              />
            </span>
          )}
          {clips.length} {clips.length === 1 ? 'clip' : 'clips'}
        </div>

        {/* Hover/focus play disc — mirrors keyboard focus on the link wrapper
            (a11y) so disc doesn't only reveal on pointer hover. */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100 transition-all duration-300 ease-out motion-reduce:transition-none pointer-events-none">
          <div
            className="rounded-full p-4 shadow-2xl"
            style={{
              backgroundColor: 'rgba(214,213,201,0.95)',
              color: 'var(--night)',
            }}
          >
            <Play className="h-5 w-5 fill-current" />
          </div>
        </div>

        {/* Bottom: title overlay */}
        <div className="absolute bottom-0 inset-x-0 px-5 pb-4 pointer-events-none">
          <div
            className="text-[11px] uppercase tracking-widest mb-1"
            style={{ color: 'var(--text-subtle)' }}
          >
            {formatDateLabel(matchDate)}
          </div>
          <div
            className="text-xl font-semibold tracking-tight"
            style={{ color: 'var(--timberwolf)' }}
          >
            {homeTeam} <span style={{ color: 'var(--text-muted)' }}>vs</span>{' '}
            {awayTeam}
          </div>
        </div>
      </Link>

      {/* Clip-moment chips below the thumbnail */}
      {clips.length > 0 && (
        <div
          className="px-5 py-3 flex flex-wrap items-center gap-2 border-t"
          style={{ borderColor: 'var(--line)' }}
        >
          {clips.map((clip) => {
            const cfg = TYPE_CONFIG[clip.type] ?? TYPE_CONFIG.custom;
            const Icon = cfg.Icon;
            const clipIsNew = isNew(clip.attributedAt, lastSeenMs);
            const clipLabel = `${cfg.label}${clip.title ? `: ${clip.title}` : ''}`;
            return (
              <span
                key={clip.attributionId}
                className="inline-flex items-stretch rounded-full overflow-hidden border"
                style={{ borderColor: 'var(--line)' }}
              >
                <Link
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${clipLabel} — opens the full match (clip-level deep-link is coming soon)`}
                  aria-label={`${clipLabel}${clipIsNew ? ', new' : ''}, opens full match`}
                  className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--timberwolf)]/50"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--timberwolf)',
                  }}
                >
                  {clipIsNew && (
                    // Static dot — the pill-level pulse already carries the
                    // motion signal; per-chip animation reads as nervous.
                    <span
                      aria-hidden
                      className="inline-flex h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--timberwolf)' }}
                    />
                  )}
                  <Icon className="h-3 w-3" />
                  <span>{cfg.label}</span>
                  {clip.title && (
                    <span
                      className="hidden sm:inline truncate max-w-[180px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      · {clip.title}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShareClip(clip);
                  }}
                  aria-label={`Share ${clipLabel}`}
                  title="Share clip"
                  // Resting Share2 sits on `--ash-grey` (not `--text-muted`)
                  // so the icon reads as actionable, not disabled — the chip
                  // is a two-action segmented control, not a watch link with
                  // a decorative end cap.
                  className="inline-flex items-center justify-center px-2 py-1.5 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--timberwolf)]/50 hover:bg-[var(--surface-1)] hover:text-[var(--timberwolf)]"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--ash-grey)',
                    borderLeft: '1px solid var(--line-strong)',
                  }}
                >
                  <Share2 className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <Link
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium hover:underline focus-visible:outline-none focus-visible:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            Watch full match
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {shareClip && (
        <ShareClipModal
          open
          onOpenChange={(o) => {
            if (!o) setShareClip(null);
          }}
          recordingId={recordingId}
          attributionId={shareClip.attributionId}
          clipType={shareClip.type}
          clipTitle={shareClip.title}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          playhubBaseUrl={playhubBaseUrl}
        />
      )}
    </article>
  );
}

function isNew(
  attributedAt: string | undefined,
  lastSeenMs: number | null
): boolean {
  if (!attributedAt) return false;
  // Null lastSeen = first-ever dashboard load. Render NEW on every clip so
  // the user sees what happened while they were away. After mount, the
  // dashboard writes back last_dashboard_view_at and the next paint clears.
  if (lastSeenMs === null) return true;
  const t = new Date(attributedAt).getTime();
  if (Number.isNaN(t)) return false;
  return t > lastSeenMs;
}

/**
 * Editorial fixture-card poster for recordings with no thumbnail. Reads as a
 * deliberate sport-broadcast slate, not a missing-asset placeholder. Stack:
 *  - Diagonal repeating-line pattern (sport-card energy)
 *  - Faint dot grid for texture
 *  - Outer vignette via inset shadow
 *  - Centre monogram (first letter of owner club / home team)
 *  - "MATCH RECORDING" eyebrow underneath the monogram
 */
function BrandedThumbnailFallback({ monogram }: { monogram: string }) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            // Diagonal stripes — broadcast slate texture
            'repeating-linear-gradient(135deg, rgba(214,213,201,0.045) 0 1px, transparent 1px 14px)',
            // Faint dot grid
            'radial-gradient(circle, rgba(214,213,201,0.04) 1px, transparent 1px)',
            // Centre glow so the monogram has ambient warmth
            'radial-gradient(circle at 50% 45%, rgba(214,213,201,0.05), transparent 65%)',
          ].join(','),
          backgroundSize: 'auto, 24px 24px, auto',
          boxShadow: 'inset 0 0 140px rgba(0,0,0,0.55)',
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
        <span
          aria-hidden
          className="font-semibold tracking-tight leading-none select-none"
          style={{
            fontSize: 'clamp(56px, 9vw, 88px)',
            color: 'var(--timberwolf)',
            opacity: 0.24,
          }}
        >
          {monogram}
        </span>
        <div
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em]"
          style={{ color: 'var(--text-subtle)' }}
        >
          <Film className="h-3 w-3" aria-hidden />
          Match recording
        </div>
      </div>
    </>
  );
}
