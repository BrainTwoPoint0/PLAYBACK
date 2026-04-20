'use client';

import { Sport } from '@/lib/playscanner/types';

interface QuickFiltersProps {
  sport: Sport;
  activeFilters: Set<string>;
  onToggle: (filter: string) => void;
}

const TIME_CHIPS = [
  { id: 'morning', label: 'Morning', range: [6, 12] },
  { id: 'afternoon', label: 'Afternoon', range: [12, 17] },
  { id: 'evening', label: 'Evening', range: [17, 23] },
];

const SPORT_CHIPS: Record<string, { id: string; label: string }[]> = {
  padel: [{ id: 'indoor', label: 'Indoor' }],
  tennis: [{ id: 'indoor', label: 'Indoor' }],
  football: [{ id: 'drop_in', label: 'Drop-in' }],
  basketball: [],
};

export default function QuickFilters({
  sport,
  activeFilters,
  onToggle,
}: QuickFiltersProps) {
  const sportChips = SPORT_CHIPS[sport] || [];
  const allChips = [
    ...TIME_CHIPS.map((t) => ({ id: t.id, label: t.label })),
    ...sportChips,
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {allChips.map((chip) => {
        const active = activeFilters.has(chip.id);
        return (
          <button
            key={chip.id}
            onClick={() => onToggle(chip.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              active
                ? 'bg-[rgba(214,213,201,0.15)] text-timberwolf border border-[rgba(214,213,201,0.3)]'
                : 'bg-[rgba(214,213,201,0.03)] text-ink-muted border border-transparent hover:text-timberwolf hover:bg-[rgba(214,213,201,0.05)]'
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

export { TIME_CHIPS };
