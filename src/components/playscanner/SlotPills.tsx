'use client';

import { useState, useMemo } from 'react';
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
  const [expanded, setExpanded] = useState(false);

  // Group slots by time — show unique times with cheapest price + court count
  const timeGroups = useMemo(() => {
    const groups = new Map<string, TimeGroup>();

    for (const slot of slots) {
      const time = new Date(slot.startTime).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
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
  }, [slots]);

  const visible = expanded ? timeGroups : timeGroups.slice(0, maxVisible);
  const hasMore = timeGroups.length > maxVisible;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((group) => {
        const price =
          group.cheapest > 0 ? `£${(group.cheapest / 100).toFixed(0)}` : null;
        const courtCount = group.slots.length;
        // Pick the cheapest slot to book when clicked
        const bestSlot = group.slots.reduce((a, b) =>
          a.price <= b.price ? a : b
        );

        return (
          <button
            key={group.time}
            onClick={() => onBook(bestSlot)}
            className="group relative flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-sm transition-all hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.04] active:scale-[0.97]"
          >
            <span className="font-medium text-white">{group.time}</span>
            {price && (
              <span className="text-[11px] text-gray-500 group-hover:text-[#00FF88]/70">
                {price}
              </span>
            )}
            {courtCount > 1 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/[0.08] text-[9px] text-gray-400">
                {courtCount}
              </span>
            )}
          </button>
        );
      })}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-xs text-gray-500 transition-colors hover:text-gray-300"
        >
          {expanded ? 'Less' : `+${timeGroups.length - maxVisible}`}
        </button>
      )}
    </div>
  );
}
