import {
  FOOTBALL_POSITION_LABELS,
  type FootballPosition,
} from '@/lib/profile/constants';

interface ProfilePositionsProps {
  primaryPosition: string | null;
  secondaryPositions: string[] | null;
}

export function ProfilePositions({
  primaryPosition,
  secondaryPositions,
}: ProfilePositionsProps) {
  if (!primaryPosition) return null;

  const primaryLabel =
    FOOTBALL_POSITION_LABELS[primaryPosition as FootballPosition] ||
    primaryPosition;

  return (
    <div className="space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--ash-grey)' }}
      >
        Positions
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        {/* Primary position - more prominent */}
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-green-400/10 text-green-400 border border-green-400/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          {primaryLabel}
          <span className="text-green-400/60 text-xs font-normal ml-1">
            {primaryPosition}
          </span>
        </span>

        {/* Secondary positions */}
        {secondaryPositions &&
          secondaryPositions.map((pos) => {
            const label =
              FOOTBALL_POSITION_LABELS[pos as FootballPosition] || pos;
            return (
              <span
                key={pos}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-neutral-800/40 border border-neutral-700/30"
                style={{ color: 'var(--ash-grey)' }}
              >
                {label}
                <span className="opacity-50 text-xs">{pos}</span>
              </span>
            );
          })}
      </div>
    </div>
  );
}
