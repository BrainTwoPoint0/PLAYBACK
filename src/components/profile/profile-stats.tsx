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
    <div className="space-y-4">
      <h2
        className="text-lg font-semibold"
        style={{ color: 'var(--timberwolf)' }}
      >
        Statistics
      </h2>

      {stats.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-neutral-800/20 border border-neutral-700/30">
          <BarChart3
            className="h-8 w-8 mx-auto mb-3"
            style={{ color: 'var(--ash-grey)' }}
          />
          <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
            No stats yet
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--ash-grey)' }}>
            Stats from PlayerData and manual entries will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/30"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  {stat.stat_type}
                </span>
                <span className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                  {new Date(stat.stat_date).toLocaleDateString()}
                </span>
              </div>
              {stat.opponent && (
                <p
                  className="text-xs mb-2"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  vs {stat.opponent}
                  {stat.competition && ` • ${stat.competition}`}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {Object.entries(stat.metrics as Record<string, unknown>).map(
                  ([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-lg font-bold text-green-400">
                        {String(value)}
                      </p>
                      <p
                        className="text-xs"
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
