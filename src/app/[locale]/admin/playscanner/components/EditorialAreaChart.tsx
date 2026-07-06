'use client';

import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ADMIN_AMBER,
  CHART_AXIS,
  CHART_CROSSHAIR,
  CHART_GRID,
  CHART_TICK,
  SERIES_MUTED,
  SERIES_SUBTLE,
} from './theme';

interface SeriesSpec {
  key: 'sessions' | 'searches' | 'conversions' | 'revenue';
  label: string;
  colour: 'amber' | 'muted' | 'subtle';
}

interface EditorialAreaChartProps {
  data: Array<{
    date: string;
    sessions: number;
    searches: number;
    conversions: number;
    revenue: number;
  }>;
  series: SeriesSpec[];
  height?: number;
  // When true, Y-axis values render as GBP; otherwise plain integers.
  yFormat?: 'count' | 'currency';
}

const COLOUR_MAP: Record<SeriesSpec['colour'], string> = {
  amber: ADMIN_AMBER,
  muted: SERIES_MUTED,
  subtle: SERIES_SUBTLE,
};

function formatTick(n: number, mode: 'count' | 'currency') {
  if (mode === 'currency') {
    if (n >= 1000) return `£${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
    return `£${Math.round(n)}`;
  }
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${Math.round(n)}`;
}

export function EditorialAreaChart({
  data,
  series,
  height = 280,
  yFormat = 'count',
}: EditorialAreaChartProps) {
  const idRoot = useId();
  const gradientPrefix = `grad-${idRoot}-${series.map((s) => s.key).join('-')}`;
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const fmt = new Intl.NumberFormat('en-GB', {
    ...(yFormat === 'currency'
      ? { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }
      : {}),
  });
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`${gradientPrefix}-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={COLOUR_MAP[s.colour]}
                  stopOpacity={0.22}
                />
                <stop
                  offset="85%"
                  stopColor={COLOUR_MAP[s.colour]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            stroke={CHART_GRID}
            strokeDasharray="0"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={{ stroke: CHART_AXIS }}
            tickLine={false}
            tick={{
              fill: CHART_TICK,
              fontSize: 10.5,
              letterSpacing: '0.04em',
            }}
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString('en-GB', {
                month: 'short',
                day: 'numeric',
              })
            }
            minTickGap={28}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: CHART_TICK,
              fontSize: 10.5,
              letterSpacing: '0.04em',
            }}
            tickFormatter={(v: number) => formatTick(v, yFormat)}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: CHART_CROSSHAIR, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const dateLabel = label
                ? new Date(String(label)).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })
                : '';
              return (
                <div className="rounded-md border border-line-strong bg-[rgba(10,16,13,0.96)] backdrop-blur-md px-3 py-2 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]">
                  <div className="text-[10.5px] uppercase tracking-[0.18em] text-ink-subtle">
                    {dateLabel}
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {payload.map((entry) => {
                      const spec = series.find((s) => s.key === entry.dataKey);
                      if (!spec) return null;
                      return (
                        <div
                          key={spec.key}
                          className="flex items-center gap-2 text-[13px] text-timberwolf tabular-nums"
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-[1px]"
                            style={{ backgroundColor: COLOUR_MAP[spec.colour] }}
                            aria-hidden
                          />
                          <span className="text-ink-muted">{spec.label}</span>
                          <span className="ml-auto">
                            {fmt.format(Number(entry.value ?? 0))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={COLOUR_MAP[s.colour]}
              strokeWidth={1.5}
              fill={`url(#${gradientPrefix}-${s.key})`}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={500}
              animationEasing="ease-out"
              activeDot={{
                r: 3,
                stroke: '#0a100d',
                strokeWidth: 2,
                fill: COLOUR_MAP[s.colour],
              }}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
