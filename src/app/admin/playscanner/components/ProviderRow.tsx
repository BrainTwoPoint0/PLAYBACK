'use client';

import { ADMIN_AMBER } from './theme';

interface ProviderRowProps {
  rank: number;
  name: string;
  bookings: number;
  revenue: number;
  revenueMax: number;
  currencyFormatter: Intl.NumberFormat;
}

export function ProviderRow({
  rank,
  name,
  bookings,
  revenue,
  revenueMax,
  currencyFormatter,
}: ProviderRowProps) {
  const width = revenueMax > 0 ? (revenue / revenueMax) * 100 : 0;
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3 border-b border-line last:border-b-0">
      <div className="text-[11px] tabular-nums text-ink-subtle w-6">
        {String(rank).padStart(2, '0')}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <div className="truncate text-[13px] text-timberwolf">{name}</div>
          <div className="text-[11px] text-ink-muted tabular-nums whitespace-nowrap">
            {bookings} {bookings === 1 ? 'booking' : 'bookings'}
          </div>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-[rgba(214,213,201,0.06)] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(width, 1)}%`,
              backgroundColor: ADMIN_AMBER,
            }}
          />
        </div>
      </div>
      <div className="text-[13px] tabular-nums font-medium text-timberwolf whitespace-nowrap">
        {currencyFormatter.format(revenue)}
      </div>
    </div>
  );
}
