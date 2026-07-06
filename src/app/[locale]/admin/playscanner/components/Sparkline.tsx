'use client';

import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ADMIN_AMBER, SERIES_MUTED } from './theme';

// Chrome-less area chart. No axes, no grid, no tooltip. Purely a trend shape.
// Renders an amber/ash fill that fades to transparent.
interface SparklineProps {
  data: number[];
  height?: number;
  colour?: 'amber' | 'muted';
  className?: string;
}

export function Sparkline({
  data,
  height = 32,
  colour = 'muted',
  className,
}: SparklineProps) {
  const gradientId = useId();
  if (data.length === 0)
    return <div style={{ height }} className={className} />;
  const shaped = data.map((value, index) => ({ index, value }));
  const stroke = colour === 'amber' ? ADMIN_AMBER : SERIES_MUTED;

  return (
    <div style={{ height }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={shaped}
          margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.25}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
