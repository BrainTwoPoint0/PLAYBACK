'use client';

import { useId } from 'react';
import { DeltaChip } from './DeltaChip';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ADMIN_AMBER } from './theme';

interface RevenueHeroProps {
  current: number;
  previous: number;
  timeframeLabel: string;
  currencyCode?: string;
  series: number[];
  topProvider?: { name: string; revenue: number } | null;
}

// Hero band — the one "expensive" moment on the page. Single ~88px figure,
// right-hand amber sparkline running to the container gutter. No card chrome;
// a single hairline underneath the whole row separates it from the KPI strip.
export function RevenueHero({
  current,
  previous,
  timeframeLabel,
  currencyCode = 'GBP',
  series,
  topProvider,
}: RevenueHeroProps) {
  const shaped = series.map((value, index) => ({ index, value }));
  const gradientId = useId();
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  });
  return (
    <section className="relative grid grid-cols-12 gap-4 md:gap-6 items-center pt-6 md:pt-8 pb-8 md:pb-10 border-b border-line">
      <div className="col-span-12 md:col-span-7">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-[#E0AD62] shadow-[0_0_8px_rgba(224,173,98,0.55)]"
          />
          Potential commission
        </div>
        <div className="mt-3 md:mt-4 flex items-end gap-3 md:gap-4 flex-wrap">
          <div className="font-display leading-none tracking-[-0.035em] text-timberwolf tabular-nums text-[clamp(48px,10vw,88px)] font-normal">
            {formatter.format(current)}
          </div>
          <DeltaChip
            current={current}
            previous={previous}
            className="mb-2 md:mb-3"
          />
        </div>
        <div className="mt-2 md:mt-3 text-[12px] text-ink-muted">
          {timeframeLabel} · vs {formatter.format(previous)} previous period
        </div>
        {/* Honest caveat: this is upper-bound potential, not realised
            revenue. Clicks ≠ bookings, and commission rates are
            pre-contract assumptions (3–6%), not contracted terms. */}
        <div className="mt-1.5 md:mt-2 text-[11px] text-ink-subtle leading-relaxed">
          Upper bound. Assumes every booking click converts at the
          provider&apos;s assumed affiliate rate (3–6%). Not realised revenue
          until contracted.
        </div>
        {topProvider && topProvider.revenue > 0 && (
          <div className="mt-1.5 md:mt-2 text-[12px] text-ink-muted">
            Top: <span className="text-timberwolf">{topProvider.name}</span>{' '}
            <span className="tabular-nums">
              {formatter.format(topProvider.revenue)}
            </span>
          </div>
        )}
      </div>
      {/* Sparkline bleeds to the container gutter on every breakpoint. On
          mobile it sits below the number; on desktop it floats right as a
          5-col inset. */}
      <div className="col-span-12 md:col-span-5 h-[80px] md:h-[160px] -mr-4 sm:-mr-6 md:-mr-8">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={shaped}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ADMIN_AMBER} stopOpacity={0.3} />
                <stop offset="100%" stopColor={ADMIN_AMBER} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={ADMIN_AMBER}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
