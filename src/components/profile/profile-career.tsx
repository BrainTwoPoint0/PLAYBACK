import { Briefcase } from 'lucide-react';

interface CareerEntry {
  id: string;
  organization_name: string | null;
  role: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
}

interface ProfileCareerProps {
  entries: CareerEntry[];
}

export function ProfileCareer({ entries }: ProfileCareerProps) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--ash-grey)' }}
      >
        Career
      </h2>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex gap-3 p-3 rounded-xl border border-neutral-800/50"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-800/50 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-green-400" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--timberwolf)' }}
              >
                {entry.organization_name}
              </p>
              {entry.role && (
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  {entry.role}
                </p>
              )}
              <p
                className="text-xs mt-1 opacity-60"
                style={{ color: 'var(--ash-grey)' }}
              >
                {formatDateRange(
                  entry.start_date,
                  entry.end_date,
                  entry.is_current
                )}
              </p>
              {entry.description && (
                <p
                  className="text-xs mt-2 leading-relaxed"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  {entry.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDateRange(
  start: string | null,
  end: string | null,
  isCurrent: boolean | null
): string {
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      year: 'numeric',
    });
  };

  if (!start && !end) return isCurrent ? 'Present' : '';
  if (start && !end && isCurrent) return `${formatDate(start)} - Present`;
  if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
  if (start) return formatDate(start);
  return '';
}
