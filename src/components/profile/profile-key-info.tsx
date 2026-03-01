import {
  FOOTBALL_EXPERIENCE_LABELS,
  FOOTBALL_POSITION_LABELS,
  type FootballExperienceLevel,
  type FootballPosition,
} from '@/lib/profile/constants';
import {
  Footprints,
  Ruler,
  Weight,
  Calendar,
  Shield,
  Hash,
} from 'lucide-react';

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
  const expLabel =
    FOOTBALL_EXPERIENCE_LABELS[experienceLevel as FootballExperienceLevel] ||
    experienceLevel;

  const items = [
    {
      icon: <Shield className="h-4 w-4" />,
      label: 'Position',
      value: posLabel,
    },
    {
      icon: <Footprints className="h-4 w-4" />,
      label: 'Preferred Foot',
      value: preferredFoot
        ? preferredFoot.charAt(0).toUpperCase() + preferredFoot.slice(1)
        : null,
    },
    {
      icon: <Ruler className="h-4 w-4" />,
      label: 'Height',
      value: heightCm ? `${heightCm} cm` : null,
    },
    {
      icon: <Weight className="h-4 w-4" />,
      label: 'Weight',
      value: weightKg ? `${weightKg} kg` : null,
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: 'Age',
      value: age !== null ? `${age}` : null,
    },
    {
      icon: <Hash className="h-4 w-4" />,
      label: 'Jersey',
      value: jerseyNumber ? `#${jerseyNumber}` : null,
    },
  ];

  // Only show items that have values
  const visibleItems = items.filter((item) => item.value);

  if (visibleItems.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2
        className="text-lg font-semibold"
        style={{ color: 'var(--timberwolf)' }}
      >
        Key Information
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {visibleItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/30 border border-neutral-700/30"
          >
            <div className="p-2 rounded-lg bg-neutral-700/30 text-green-400">
              {item.icon}
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                {item.label}
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                {item.value}
              </p>
            </div>
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
