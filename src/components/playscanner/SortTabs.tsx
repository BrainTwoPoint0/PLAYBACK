'use client';

import { useMemo } from 'react';
import { CourtSlot, PROVIDER_CONFIG } from '@/lib/playscanner/types';

type SortMode = 'best' | 'cheapest' | 'soonest';

interface SortTabsProps {
  results: CourtSlot[];
  active: SortMode;
  onChange: (mode: SortMode) => void;
}

export default function SortTabs({ results, active, onChange }: SortTabsProps) {
  const previews = useMemo(() => {
    if (results.length === 0) return null;

    const cheapest = [...results].sort((a, b) => a.price - b.price)[0];
    const soonest = [...results].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )[0];
    // "Best" = lowest price among the soonest 30% of results
    const sorted = [...results].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    const soonestThird = sorted.slice(
      0,
      Math.max(Math.ceil(sorted.length * 0.3), 3)
    );
    const best = soonestThird.sort((a, b) => a.price - b.price)[0];

    return {
      best: best
        ? { label: best.venue.name, sub: `£${(best.price / 100).toFixed(0)}` }
        : null,
      cheapest: cheapest
        ? {
            label: `£${(cheapest.price / 100).toFixed(0)}`,
            sub:
              PROVIDER_CONFIG[cheapest.provider]?.displayName ||
              cheapest.provider,
          }
        : null,
      soonest: soonest
        ? {
            label: new Date(soonest.startTime).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            sub: soonest.venue.name,
          }
        : null,
    };
  }, [results]);

  if (!previews) return null;

  const tabs: {
    key: SortMode;
    title: string;
    preview: typeof previews.best;
  }[] = [
    { key: 'best', title: 'Best', preview: previews.best },
    { key: 'cheapest', title: 'Cheapest', preview: previews.cheapest },
    { key: 'soonest', title: 'Soonest', preview: previews.soonest },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`rounded-lg border p-2.5 text-left transition-all ${
            active === tab.key
              ? 'border-[#00FF88]/40 bg-[#00FF88]/[0.06]'
              : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
          }`}
        >
          <div
            className={`text-xs font-medium ${
              active === tab.key ? 'text-[#00FF88]' : 'text-gray-400'
            }`}
          >
            {tab.title}
          </div>
          {tab.preview && (
            <>
              <div className="mt-0.5 truncate text-sm font-semibold text-white">
                {tab.preview.label}
              </div>
              <div className="truncate text-[11px] text-gray-500">
                {tab.preview.sub}
              </div>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

export type { SortMode };
