'use client';

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

// Percent-change pill. Sage for positive, terracotta for negative, ash-grey
// for zero. Always pairs color with a glyph (a11y). `current` / `previous`
// is a pure helper — render either the computed percent or an em-dash when
// the previous period was zero (division is undefined).
interface DeltaChipProps {
  current: number;
  previous: number;
  // If true, inverted semantics (e.g. bounce rate — lower is better).
  invert?: boolean;
  className?: string;
}

export function DeltaChip({
  current,
  previous,
  invert = false,
  className = '',
}: DeltaChipProps) {
  // Zero previous with a non-zero current is a "new" delta (division by zero
  // is mathematically undefined but operationally meaningful). Show a sage
  // "NEW" pill so the user sees the trend rather than an em-dash.
  if (!previous) {
    if (current > 0) {
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] tabular-nums tracking-[0.02em] bg-[rgba(127,169,138,0.10)] text-[#7FA98A] border-[rgba(127,169,138,0.22)] ${className}`}
          aria-label="new versus previous period"
        >
          <ArrowUp className="h-2.5 w-2.5" aria-hidden />
          <span>NEW</span>
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] tabular-nums tracking-[0.02em] border border-line text-ink-subtle ${className}`}
        aria-label="no change versus previous period"
      >
        <Minus className="h-2.5 w-2.5" aria-hidden />
        <span>—</span>
      </span>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const sign = pct > 0 ? 1 : pct < 0 ? -1 : 0;
  const goodness = invert ? -sign : sign;

  const palette =
    goodness > 0
      ? {
          bg: 'bg-[rgba(127,169,138,0.10)]',
          text: 'text-[#7FA98A]',
          border: 'border-[rgba(127,169,138,0.22)]',
        }
      : goodness < 0
        ? {
            bg: 'bg-[rgba(196,122,109,0.10)]',
            text: 'text-[#C47A6D]',
            border: 'border-[rgba(196,122,109,0.22)]',
          }
        : {
            bg: 'bg-[rgba(214,213,201,0.04)]',
            text: 'text-ink-subtle',
            border: 'border-line',
          };

  const Icon = sign > 0 ? ArrowUp : sign < 0 ? ArrowDown : Minus;
  const direction = sign > 0 ? 'up' : sign < 0 ? 'down' : 'flat';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] tabular-nums tracking-[0.02em] ${palette.bg} ${palette.text} ${palette.border} ${className}`}
      aria-label={`${direction} ${Math.abs(pct).toFixed(1)} percent versus previous period`}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden />
      <span aria-hidden>
        {sign >= 0 ? '+' : ''}
        {pct.toFixed(1)}%
      </span>
    </span>
  );
}
