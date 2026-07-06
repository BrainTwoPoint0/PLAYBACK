'use client';

import { useTranslations } from 'next-intl';
import { Sport } from '@/lib/playscanner/types';

interface QuickFiltersProps {
  sport: Sport;
  activeFilters: Set<string>;
  onToggle: (filter: string) => void;
}

const TIME_CHIPS = [
  { id: 'morning', range: [6, 12] },
  { id: 'afternoon', range: [12, 17] },
  { id: 'evening', range: [17, 23] },
];

const SPORT_CHIPS: Record<string, string[]> = {
  padel: ['indoor'],
  tennis: ['indoor'],
  football: ['drop_in'],
  basketball: [],
};

export default function QuickFilters({
  sport,
  activeFilters,
  onToggle,
}: QuickFiltersProps) {
  const t = useTranslations('playscanner.filters');
  const chipLabel = (id: string) => {
    if (id === 'indoor') return t('indoor');
    if (id === 'drop_in') return t('dropIn');
    return t(`time.${id}`);
  };

  const allChips = [
    ...TIME_CHIPS.map((c) => c.id),
    ...(SPORT_CHIPS[sport] || []),
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {allChips.map((id) => {
        const active = activeFilters.has(id);
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              active
                ? 'bg-[rgba(214,213,201,0.15)] text-timberwolf border border-[rgba(214,213,201,0.3)]'
                : 'bg-[rgba(214,213,201,0.03)] text-ink-muted border border-transparent hover:text-timberwolf hover:bg-[rgba(214,213,201,0.05)]'
            }`}
          >
            {chipLabel(id)}
          </button>
        );
      })}
    </div>
  );
}

export { TIME_CHIPS };
