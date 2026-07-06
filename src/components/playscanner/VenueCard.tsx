'use client';

import { useTranslations, useFormatter } from 'next-intl';
import { CourtSlot, PROVIDER_CONFIG } from '@/lib/playscanner/types';
import SlotPills from './SlotPills';

interface VenueGroup {
  venueId: string;
  venueName: string;
  provider: string;
  sport: string;
  city: string;
  slots: CourtSlot[];
  cheapest: number;
  mostExpensive: number;
  indoor: boolean;
  surface: string;
  courtNames: string[];
  listingType: string;
  collectedAt: string | null;
}

interface VenueCardProps {
  group: VenueGroup;
  onBook: (slot: CourtSlot) => void;
}

interface Tag {
  /** Stable semantic id — used for keys, styling and dedup, never shown. */
  id: string;
  label: string;
}

export default function VenueCard({ group, onBook }: VenueCardProps) {
  const t = useTranslations('playscanner.venue');
  const format = useFormatter();

  const providerConfig = PROVIDER_CONFIG[group.provider] || {
    displayName: group.provider,
    color: '#888',
  };

  const timeAgo = (iso: string | null): string => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return t('justNow');
    if (min < 60) return t('minutesAgo', { minutes: min });
    return t('hoursAgo', { hours: Math.floor(min / 60) });
  };

  const currency = group.slots[0]?.currency ?? 'GBP';
  const formatPrice = (pence: number) =>
    format.number(pence / 100, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
    });

  const isDropIn = group.listingType === 'drop_in';
  // Use the cheapest slot's duration for the price label (not an average)
  const cheapestSlot = group.slots.reduce(
    (min, s) =>
      s.price > 0 && (min.price === 0 || s.price < min.price) ? s : min,
    group.slots[0]
  );
  const displayDuration = cheapestSlot?.duration || 60;
  const priceLabel = isDropIn
    ? t('perPerson')
    : displayDuration === 60
      ? t('perHour')
      : t('perDuration', { minutes: displayDuration });

  // Features tags - sport-specific metadata first
  const tags: Tag[] = [];
  if (isDropIn) tags.push({ id: 'drop_in', label: t('tags.dropIn') });

  // Sport-specific metadata
  const firstSlot = group.slots[0];
  if (firstSlot?.sportMeta) {
    const meta = firstSlot.sportMeta;
    if ('format' in meta && meta.format && group.sport === 'football') {
      // Football format: 5v5, 7v7, etc. → "5-a-side" (raw value if unknown)
      const aSide = /^(\d+)v\d+$/.exec(meta.format);
      tags.push({
        id: meta.format,
        label: aSide
          ? t('tags.aSide', { count: Number(aSide[1]) })
          : meta.format,
      });
    }
    if ('courtType' in meta && meta.courtType) {
      // Padel: indoor/outdoor/panoramic
      if (meta.courtType === 'panoramic')
        tags.push({ id: 'panoramic', label: t('tags.panoramic') });
      else if (meta.courtType === 'indoor')
        tags.push({ id: 'indoor', label: t('tags.indoor') });
      else tags.push({ id: 'outdoor', label: t('tags.outdoor') });
    }
    if ('surface' in meta && meta.surface && group.sport === 'tennis') {
      // Tennis surface: hard/clay/grass (raw data value falls through)
      tags.push({
        id: meta.surface,
        label: t('tags.surface', { surface: meta.surface }),
      });
    }
  } else {
    if (group.indoor) tags.push({ id: 'indoor', label: t('tags.indoor') });
  }

  if (
    group.surface &&
    group.surface !== 'artificial' &&
    group.surface !== 'unknown' &&
    !tags.some((tg) => tg.id.toLowerCase() === group.surface.toLowerCase())
  )
    tags.push({ id: group.surface, label: group.surface.toUpperCase() });
  if (firstSlot?.durationOptions && firstSlot.durationOptions.length > 1) {
    const durations = firstSlot.durationOptions
      .map((d) => `${d.duration}`)
      .join('/');
    tags.push({
      id: `durations-${durations}`,
      label: t('tags.durations', { durations }),
    });
  }

  // Court names summary
  const uniqueCourts = [...new Set(group.courtNames.filter(Boolean))];
  const courtSummary =
    uniqueCourts.length > 3
      ? t('courtsCount', { count: uniqueCourts.length })
      : uniqueCourts.length > 0
        ? uniqueCourts.slice(0, 2).join(', ')
        : '';

  // Spots left for drop-in games - only show if we have real data (totalSpots > 1)
  const spotsLeft = isDropIn
    ? group.slots.reduce((sum, s) => {
        const total = s.availability?.totalSpots || 0;
        if (total <= 1) return sum; // Skip default/unknown availability
        return sum + (s.availability?.spotsAvailable || 0);
      }, 0) || null
    : null;

  return (
    <div
      className={`group rounded-xl border px-4 py-3 transition-colors hover:bg-[rgba(214,213,201,0.03)] ${
        isDropIn
          ? 'border-[rgba(224,173,98,0.22)] bg-[rgba(224,173,98,0.03)]'
          : 'border-line bg-[rgba(214,213,201,0.02)]'
      }`}
    >
      {/* Row 1: Venue name + price */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold text-timberwolf tracking-[-0.01em]">
            {group.venueName}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
            <span
              className="inline-flex items-center gap-1"
              style={{ color: providerConfig.color }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: providerConfig.color }}
              />
              {providerConfig.displayName}
            </span>
            {courtSummary && (
              <>
                <span className="text-ink-subtle">·</span>
                <span>{courtSummary}</span>
              </>
            )}
            {group.collectedAt && (
              <>
                <span className="text-ink-subtle">·</span>
                <span className="text-ink-muted">
                  {timeAgo(group.collectedAt)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 text-end">
          {group.cheapest > 0 ? (
            <>
              <span className="text-lg font-bold text-timberwolf">
                {formatPrice(group.cheapest)}
                {group.mostExpensive > group.cheapest && (
                  <span className="text-sm font-medium text-ink-muted">
                    –{formatPrice(group.mostExpensive)}
                  </span>
                )}
              </span>
              <span className="ms-0.5 text-xs text-ink-muted">
                {priceLabel}
              </span>
            </>
          ) : (
            <span className="text-xs text-ink-muted">{t('priceOnSite')}</span>
          )}
        </div>
      </div>

      {/* Row 2: Feature tags + spots left */}
      {(tags.length > 0 || spotsLeft !== null) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                tag.id === 'drop_in'
                  ? 'bg-[rgba(224,173,98,0.15)] text-[rgb(224,173,98)]'
                  : 'bg-[rgba(214,213,201,0.06)] text-ink-muted'
              }`}
            >
              {tag.label}
            </span>
          ))}
          {spotsLeft !== null && spotsLeft > 0 && (
            <span className="rounded-md bg-[rgba(224,173,98,0.15)] px-2 py-0.5 text-[11px] font-medium text-[rgb(224,173,98)]">
              {t('spotsLeft', { count: spotsLeft })}
            </span>
          )}
        </div>
      )}

      {/* Row 3: Time slot pills */}
      <div className="mt-2">
        <SlotPills slots={group.slots} onBook={onBook} />
      </div>
    </div>
  );
}

/**
 * Group flat slots into venue groups for rendering.
 */
export function groupSlotsByVenue(slots: CourtSlot[]): VenueGroup[] {
  const groups = new Map<string, VenueGroup>();

  for (const slot of slots) {
    const key = `${slot.venue.id}-${slot.provider}`;

    if (!groups.has(key)) {
      groups.set(key, {
        venueId: slot.venue.id,
        venueName: slot.venue.name,
        provider: slot.provider,
        sport: slot.sport,
        city: slot.venue.location?.city || slot.venue.address?.city || '',
        slots: [],
        cheapest: slot.price,
        mostExpensive: slot.price,
        indoor: slot.features?.indoor || false,
        surface: slot.features?.surface || '',
        courtNames: [],
        listingType: slot.listingType || 'pitch_hire',
        collectedAt: slot.collectedAt || null,
      });
    }

    const group = groups.get(key)!;
    group.slots.push(slot);
    if (
      slot.price > 0 &&
      (slot.price < group.cheapest || group.cheapest === 0)
    ) {
      group.cheapest = slot.price;
    }
    if (slot.price > group.mostExpensive) {
      group.mostExpensive = slot.price;
    }
    if (slot.courtName) {
      group.courtNames.push(slot.courtName);
    }
    if (
      slot.collectedAt &&
      (!group.collectedAt || slot.collectedAt > group.collectedAt)
    ) {
      group.collectedAt = slot.collectedAt;
    }
  }

  for (const group of groups.values()) {
    group.slots.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  return Array.from(groups.values());
}
