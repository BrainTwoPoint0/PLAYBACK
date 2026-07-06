import { useFormatter, useTranslations } from 'next-intl';
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
  const t = useTranslations('profile.career');
  const format = useFormatter();

  if (entries.length === 0) return null;

  // "MMM yyyy" — matches the old en-GB rendering; numberingSystem 'latn'
  // mirrors the app-wide digit pinning in src/i18n/request.ts.
  const formatDate = (d: string) =>
    format.dateTime(new Date(d), {
      month: 'short',
      year: 'numeric',
      numberingSystem: 'latn',
    });

  const formatDateRange = (
    start: string | null,
    end: string | null,
    isCurrent: boolean | null
  ): string => {
    if (!start && !end) return isCurrent ? t('present') : '';
    if (start && !end && isCurrent)
      return t('rangeOngoing', { start: formatDate(start) });
    if (start && end)
      return t('range', { start: formatDate(start), end: formatDate(end) });
    if (start) return formatDate(start);
    return '';
  };

  return (
    <div className="space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--ash-grey)' }}
      >
        {t('title')}
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
