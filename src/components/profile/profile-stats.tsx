import { BarChart3 } from 'lucide-react';

interface Stat {
  id: string;
  stat_type: string;
  stat_date: string;
  metrics: Record<string, unknown>;
  competition: string | null;
  opponent: string | null;
}

interface ProfileStatsProps {
  stats: Stat[];
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--ash-grey)' }}
      >
        Statistics
      </h2>

      {stats.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-neutral-800/50">
          <BarChart3
            className="h-6 w-6 mx-auto mb-2 opacity-30"
            style={{ color: 'var(--ash-grey)' }}
          />
          <p
            className="text-sm opacity-50"
            style={{ color: 'var(--ash-grey)' }}
          >
            No stats yet
          </p>
          <p
            className="text-xs mt-1 opacity-30"
            style={{ color: 'var(--ash-grey)' }}
          >
            Stats from PlayerData and manual entries will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/40"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  {stat.stat_type}
                </span>
                <span
                  className="text-xs tabular-nums"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  {new Date(stat.stat_date).toLocaleDateString()}
                </span>
              </div>
              {stat.opponent && (
                <p
                  className="text-xs mb-3 opacity-70"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  vs {stat.opponent}
                  {stat.competition && ` · ${stat.competition}`}
                </p>
              )}
              <div className="flex flex-wrap gap-6">
                {Object.entries(stat.metrics as Record<string, unknown>).map(
                  ([key, value]) => (
                    <div key={key}>
                      <p
                        className="text-xl font-bold leading-tight"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {String(value)}
                      </p>
                      <p
                        className="text-[11px] uppercase tracking-wide mt-0.5"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        {key.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
