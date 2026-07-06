'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { CourtSlot } from '@/lib/playscanner/types';

interface SlotPillsProps {
  slots: CourtSlot[];
  onBook: (slot: CourtSlot) => void;
  maxVisible?: number;
}

interface TimeGroup {
  time: string;
  cheapest: number;
  slots: CourtSlot[];
}

export default function SlotPills({
  slots,
  onBook,
  maxVisible = 7,
}: SlotPillsProps) {
  const t = useTranslations('playscanner.venue');
  const format = useFormatter();
  const [expanded, setExpanded] = useState(false);

  // Group slots by time - show unique times with cheapest price + court count
  const timeGroups = useMemo(() => {
    const groups = new Map<string, TimeGroup>();

    for (const slot of slots) {
      // 24h digits, always Latin numerals — pill times never localize.
      const time = format.dateTime(new Date(slot.startTime), {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        numberingSystem: 'latn',
      });

      if (!groups.has(time)) {
        groups.set(time, { time, cheapest: slot.price, slots: [] });
      }

      const group = groups.get(time)!;
      group.slots.push(slot);
      if (
        slot.price > 0 &&
        (slot.price < group.cheapest || group.cheapest === 0)
      ) {
        group.cheapest = slot.price;
      }
    }

    return Array.from(groups.values());
  }, [slots, format]);

  const currency = slots[0]?.currency ?? 'GBP';

  const visible = expanded ? timeGroups : timeGroups.slice(0, maxVisible);
  const hasMore = timeGroups.length > maxVisible;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((group) => {
        const price =
          group.cheapest > 0
            ? format.number(group.cheapest / 100, {
                style: 'currency',
                currency,
                maximumFractionDigits: 0,
                numberingSystem: 'latn',
              })
            : null;
        const courtCount = group.slots.length;
        // Pick the cheapest slot to book when clicked
        const bestSlot = group.slots.reduce((a, b) =>
          a.price <= b.price ? a : b
        );

        return (
          <button
            key={group.time}
            onClick={() => onBook(bestSlot)}
            className="group relative flex items-center gap-1.5 rounded-lg border border-line bg-[rgba(214,213,201,0.02)] px-2.5 py-1.5 text-sm transition-all hover:border-[rgba(214,213,201,0.3)] hover:bg-[rgba(214,213,201,0.04)] active:scale-[0.97]"
          >
            {/* dir="ltr" pins "18:00" so the digits don't reorder in RTL */}
            <span dir="ltr" className="font-medium text-timberwolf">
              {group.time}
            </span>
            {price && (
              <span className="text-[11px] text-ink-muted group-hover:text-[rgba(214,213,201,0.7)]">
                {price}
              </span>
            )}
            {courtCount > 1 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[rgba(214,213,201,0.08)] text-[9px] text-ink-muted">
                {courtCount}
              </span>
            )}
          </button>
        );
      })}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg border border-line bg-[rgba(214,213,201,0.02)] px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:text-timberwolf"
        >
          {expanded
            ? t('showLess')
            : t('showMoreCount', { count: timeGroups.length - maxVisible })}
        </button>
      )}
    </div>
  );
}
