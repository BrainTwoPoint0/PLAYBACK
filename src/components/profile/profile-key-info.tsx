import {
  FOOTBALL_EXPERIENCE_LABELS,
  FOOTBALL_POSITION_LABELS,
  type FootballExperienceLevel,
  type FootballPosition,
} from '@/lib/profile/constants';

interface ProfileKeyInfoProps {
  preferredFoot: string | null;
  heightCm: number | null;
  weightKg: number | null;
  dateOfBirth: string | null;
  experienceLevel: string;
  jerseyNumber: number | null;
  primaryPosition: string | null;
}

export function ProfileKeyInfo({
  preferredFoot,
  heightCm,
  weightKg,
  dateOfBirth,
  experienceLevel,
  jerseyNumber,
  primaryPosition,
}: ProfileKeyInfoProps) {
  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;
  const posLabel = primaryPosition
    ? FOOTBALL_POSITION_LABELS[primaryPosition as FootballPosition] ||
      primaryPosition
    : null;

  const items = [
    { label: 'Position', value: posLabel },
    {
      label: 'Foot',
      value: preferredFoot
        ? preferredFoot.charAt(0).toUpperCase() + preferredFoot.slice(1)
        : null,
    },
    { label: 'Height', value: heightCm ? `${heightCm}cm` : null },
    { label: 'Weight', value: weightKg ? `${weightKg}kg` : null },
    { label: 'Age', value: age !== null ? `${age}` : null },
    { label: 'Jersey', value: jerseyNumber ? `#${jerseyNumber}` : null },
  ];

  const visibleItems = items.filter((item) => item.value);

  if (visibleItems.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--ash-grey)' }}
      >
        Key Info
      </h2>
      <div className="flex flex-wrap items-center gap-x-0">
        {visibleItems.map((item, i) => (
          <div key={item.label} className="flex items-center">
            <div className="px-4 py-2 text-center">
              <p
                className="text-lg font-bold leading-tight"
                style={{ color: 'var(--timberwolf)' }}
              >
                {item.value}
              </p>
              <p
                className="text-[11px] mt-0.5 uppercase tracking-wide"
                style={{ color: 'var(--ash-grey)' }}
              >
                {item.label}
              </p>
            </div>
            {i < visibleItems.length - 1 && (
              <div
                className="w-px h-8 flex-shrink-0"
                style={{ backgroundColor: 'var(--ash-grey)', opacity: 0.2 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
