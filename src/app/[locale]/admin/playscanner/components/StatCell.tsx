'use client';

import { DeltaChip } from './DeltaChip';

// Ruled KPI cell — not a Card. Structure comes from typography and hairlines.
// Right edge is separated from its neighbour by a 1px `border-line` divider,
// applied at the strip level (see AnalyticsClient).
//
// Sparklines were cut from the cells on purpose: one sparkline in the hero
// carries the trend story; four more in the strip compete with the hero and
// flatten the information hierarchy. Delta chip alone is enough signal here.
interface StatCellProps {
  label: string;
  value: string;
  support?: string;
  current: number;
  previous: number;
  invertDelta?: boolean;
}

export function StatCell({
  label,
  value,
  support,
  current,
  previous,
  invertDelta,
}: StatCellProps) {
  return (
    <div className="relative px-7 py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
          {label}
        </div>
        <DeltaChip current={current} previous={previous} invert={invertDelta} />
      </div>
      <div className="mt-3 font-display text-[32px] font-normal leading-none tracking-[-0.02em] text-timberwolf tabular-nums">
        {value}
      </div>
      {support && (
        <div className="mt-2 text-[12px] text-ink-muted truncate">
          {support}
        </div>
      )}
    </div>
  );
}
