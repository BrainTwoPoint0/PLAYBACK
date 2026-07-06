'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  MatchGroupCard,
  type ClipType,
  type MatchClip,
} from './match-group-card';

export interface AttributedClipForFeed {
  attributionId: string;
  recordingId: string;
  recordingTitle: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  thumbnailUrl: string | null;
  type: ClipType;
  title: string | null;
  attributedAt: string;
  ownerOrgName: string | null;
}

interface DashboardFeedProps {
  clips: AttributedClipForFeed[];
  /**
   * The user's last_dashboard_view_at — passed straight through to each
   * MatchGroupCard so the NEW pulse decision is made at the chip level.
   * Null = first-ever load → every clip renders new (intended day-1 UX).
   */
  lastSeenAt?: string | null;
}

interface MatchGroup {
  recordingId: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  thumbnailUrl: string | null;
  ownerOrgName: string | null;
  clips: MatchClip[];
}

type BucketKey = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'earlier';

interface BucketedGroups {
  key: BucketKey;
  groups: MatchGroup[];
}

function bucketKey(iso: string, now: Date): BucketKey {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'earlier';
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ts = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((today.getTime() - ts) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return 'thisWeek';
  if (diffDays < 30) return 'thisMonth';
  return 'earlier';
}

const BUCKET_ORDER: BucketKey[] = [
  'today',
  'yesterday',
  'thisWeek',
  'thisMonth',
  'earlier',
];

/**
 * Groups attributed clips by recording_id, sorts by match_date desc, and
 * renders a Veo-style match-grouped feed under date bucket headings.
 *
 * Group key intentionally uses recording_id alone for v1. A multi-club
 * player attributed to two clubs' recordings of the same match is rare
 * (data-wise impossible — one recording belongs to one org). v1.2 may
 * widen the key if we ever normalize matches across orgs.
 */
export function DashboardFeed({ clips, lastSeenAt }: DashboardFeedProps) {
  const t = useTranslations('dashboard.feed');
  const buckets = useMemo<BucketedGroups[]>(() => {
    if (clips.length === 0) return [];
    const map = new Map<string, MatchGroup>();
    for (const c of clips) {
      const key = c.recordingId;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          recordingId: c.recordingId,
          homeTeam: c.homeTeam,
          awayTeam: c.awayTeam,
          matchDate: c.matchDate,
          thumbnailUrl: c.thumbnailUrl,
          ownerOrgName: c.ownerOrgName,
          clips: [
            {
              attributionId: c.attributionId,
              type: c.type,
              title: c.title,
              attributedAt: c.attributedAt,
            },
          ],
        });
      } else {
        existing.clips.push({
          attributionId: c.attributionId,
          type: c.type,
          title: c.title,
          attributedAt: c.attributedAt,
        });
      }
    }

    const groups = Array.from(map.values()).sort((a, b) => {
      const at = +new Date(a.matchDate);
      const bt = +new Date(b.matchDate);
      if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
      if (Number.isNaN(at)) return 1;
      if (Number.isNaN(bt)) return -1;
      return bt - at;
    });

    const now = new Date();
    const byKey = new Map<BucketKey, MatchGroup[]>();
    for (const g of groups) {
      const key = bucketKey(g.matchDate, now);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(g);
    }

    return BUCKET_ORDER.filter((k) => byKey.has(k)).map((key) => ({
      key,
      groups: byKey.get(key)!,
    }));
  }, [clips]);

  if (buckets.length === 0) return null;

  return (
    <div className="space-y-10">
      {buckets.map((bucket) => {
        // Today / Yesterday play full-bleed (one card per row). Older buckets
        // pack 2-up at lg+ so the page reads as a film roll, not a stack of
        // receipts (Veo / Hudl pattern for archive views).
        const isFresh = bucket.key === 'today' || bucket.key === 'yesterday';
        return (
          <section key={bucket.key} className="space-y-4">
            <h2
              className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-semibold"
              style={{ color: 'var(--ash-grey)' }}
            >
              <span>{t(`buckets.${bucket.key}`)}</span>
              <span
                className="flex-1 h-px"
                style={{ backgroundColor: 'var(--line)' }}
                aria-hidden
              />
            </h2>
            <div
              className={
                isFresh ? 'space-y-5' : 'grid grid-cols-1 lg:grid-cols-2 gap-5'
              }
            >
              {bucket.groups.map((group) => (
                <MatchGroupCard
                  key={group.recordingId}
                  recordingId={group.recordingId}
                  homeTeam={group.homeTeam}
                  awayTeam={group.awayTeam}
                  matchDate={group.matchDate}
                  thumbnailUrl={group.thumbnailUrl}
                  ownerOrgName={group.ownerOrgName}
                  clips={group.clips}
                  lastSeenAt={lastSeenAt}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
