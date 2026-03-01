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
    <div className="space-y-4">
      <h2
        className="text-lg font-semibold"
        style={{ color: 'var(--timberwolf)' }}
      >
        Positions
      </h2>

      <div className="flex flex-wrap gap-2">
        {/* Primary position */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-400/15 text-green-400 border border-green-400/30">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          {primaryPosition} — {primaryLabel}
        </span>

        {/* Secondary positions */}
        {secondaryPositions &&
          secondaryPositions.map((pos) => {
            const label =
              FOOTBALL_POSITION_LABELS[pos as FootballPosition] || pos;
            return (
              <span
                key={pos}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-neutral-800/50 border border-neutral-700/50"
                style={{ color: 'var(--ash-grey)' }}
              >
                {pos} — {label}
              </span>
            );
          })}
      </div>
    </div>
  );
}
