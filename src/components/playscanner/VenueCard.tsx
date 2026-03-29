'use client';

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

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  return `${hrs}h ago`;
}

export default function VenueCard({ group, onBook }: VenueCardProps) {
  const providerConfig = PROVIDER_CONFIG[group.provider] || {
    displayName: group.provider,
    color: '#888',
  };

  const isDropIn = group.listingType === 'drop_in';
  const priceLabel = isDropIn ? '/person' : '/hr';

  // Features tags
  const tags: string[] = [];
  if (isDropIn) tags.push('DROP-IN');
  if (group.indoor) tags.push('Indoor');
  if (
    group.surface &&
    group.surface !== 'artificial' &&
    group.surface !== 'unknown'
  )
    tags.push(group.surface.toUpperCase());
  if (
    group.slots[0]?.durationOptions &&
    group.slots[0].durationOptions.length > 1
  ) {
    const durations = group.slots[0].durationOptions
      .map((d) => `${d.duration}`)
      .join('/');
    tags.push(`${durations} min`);
  }

  // Court names summary
  const uniqueCourts = [...new Set(group.courtNames.filter(Boolean))];
  const courtSummary =
    uniqueCourts.length > 3
      ? `${uniqueCourts.length} courts`
      : uniqueCourts.length > 0
        ? uniqueCourts.slice(0, 2).join(', ')
        : '';

  // Spots left for drop-in games — only show if we have real data (totalSpots > 1)
  const spotsLeft = isDropIn
    ? group.slots.reduce((sum, s) => {
        const total = s.availability?.totalSpots || 0;
        if (total <= 1) return sum; // Skip default/unknown availability
        return sum + (s.availability?.spotsAvailable || 0);
      }, 0) || null
    : null;

  return (
    <div
      className={`group rounded-xl border p-4 transition-colors hover:bg-white/[0.03] ${
        isDropIn
          ? 'border-orange-500/20 bg-orange-500/[0.02]'
          : 'border-white/[0.06] bg-white/[0.02]'
      }`}
    >
      {/* Row 1: Venue name + price */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-white">
            {group.venueName}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400">
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
                <span className="text-gray-600">·</span>
                <span>{courtSummary}</span>
              </>
            )}
            {group.collectedAt && (
              <>
                <span className="text-gray-600">·</span>
                <span className="text-gray-500">
                  {timeAgo(group.collectedAt)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="text-lg font-bold text-[#00FF88]">
            £{(group.cheapest / 100).toFixed(0)}
          </span>
          <span className="ml-0.5 text-xs text-gray-500">{priceLabel}</span>
        </div>
      </div>

      {/* Row 2: Feature tags + spots left */}
      {(tags.length > 0 || spotsLeft !== null) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                tag === 'DROP-IN'
                  ? 'bg-orange-500/15 text-orange-400'
                  : 'bg-white/[0.06] text-gray-400'
              }`}
            >
              {tag}
            </span>
          ))}
          {spotsLeft !== null && spotsLeft > 0 && (
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
              {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
            </span>
          )}
        </div>
      )}

      {/* Row 3: Time slot pills */}
      <div className="mt-3">
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
