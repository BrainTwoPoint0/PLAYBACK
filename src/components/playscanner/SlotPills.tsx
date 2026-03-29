'use client';

import { useState } from 'react';
import { CourtSlot, PROVIDER_CONFIG } from '@/lib/playscanner/types';

interface SlotPillsProps {
  slots: CourtSlot[];
  onBook: (slot: CourtSlot) => void;
  maxVisible?: number;
}

export default function SlotPills({
  slots,
  onBook,
  maxVisible = 7,
}: SlotPillsProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? slots : slots.slice(0, maxVisible);
  const hasMore = slots.length > maxVisible;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((slot) => {
        const time = new Date(slot.startTime).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const price = slot.price > 0 ? `£${(slot.price / 100).toFixed(0)}` : '';

        return (
          <button
            key={slot.id}
            onClick={() => onBook(slot)}
            className="group relative flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm transition-all hover:border-[#00FF88]/40 hover:bg-[#00FF88]/[0.06] active:scale-[0.97]"
          >
            <span className="font-medium text-white">{time}</span>
            {price && (
              <span className="text-xs text-gray-400 group-hover:text-[#00FF88]/80">
                {price}
              </span>
            )}
          </button>
        );
      })}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-400 transition-colors hover:text-white"
        >
          {expanded ? 'Show less' : `+${slots.length - maxVisible} more`}
        </button>
      )}
    </div>
  );
}
