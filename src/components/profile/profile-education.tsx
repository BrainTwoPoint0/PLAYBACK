import { useFormatter, useTranslations } from 'next-intl';
import { GraduationCap } from 'lucide-react';

interface EducationEntry {
  id: string;
  institution_name: string;
  institution_type: string | null;
  degree_or_program: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
}

interface ProfileEducationProps {
  entries: EducationEntry[];
}

export function ProfileEducation({ entries }: ProfileEducationProps) {
  const t = useTranslations('profile');
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
    if (!start && !end) return isCurrent ? t('career.present') : '';
    if (start && !end && isCurrent)
      return t('career.rangeOngoing', { start: formatDate(start) });
    if (start && end)
      return t('career.range', {
        start: formatDate(start),
        end: formatDate(end),
      });
    if (start) return formatDate(start);
    return '';
  };

  return (
    <div className="space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--ash-grey)' }}
      >
        {t('education.title')}
      </h2>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex gap-3 p-3 rounded-xl border border-neutral-800/50"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-800/50 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-blue-400" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--timberwolf)' }}
              >
                {entry.institution_name}
              </p>
              {(entry.degree_or_program || entry.field_of_study) && (
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  {[entry.degree_or_program, entry.field_of_study]
                    .filter(Boolean)
                    .join(' - ')}
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
