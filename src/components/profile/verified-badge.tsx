import { ShieldCheck } from 'lucide-react';
import type { VerifierOrg } from '@/lib/profile/get-public-profile';

interface VerifiedBadgeProps {
  verifications: VerifierOrg[];
}

/**
 * Inline verified-badge that lists every verifying org. Multi-club verifications
 * stack — a player verified by both CFA and SEFA shows both names.
 */
export function VerifiedBadge({ verifications }: VerifiedBadgeProps) {
  if (verifications.length === 0) return null;

  const summary =
    verifications.length === 1
      ? `Verified by ${verifications[0].name}`
      : `Verified by ${verifications.length} clubs`;

  const tooltip = verifications
    .map((v) => (v.season_label ? `${v.name} · ${v.season_label}` : v.name))
    .join('\n');

  // Shows full club names inline up to 3 verifications; collapses to a count
  // beyond that. Title attribute lists each verification with season label.
  const inline =
    verifications.length <= 3
      ? `Verified by ${verifications.map((v) => v.name).join(' + ')}`
      : summary;

  // Trust signal — deliberately heavier than ambient UI. Filled shield
  // (not outline) and a slight ring carry weight; the inset highlight gives
  // the chip a subtle "minted" feel against the dark background.
  return (
    <span
      title={tooltip}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full tracking-tight"
      style={{
        backgroundColor: 'rgba(214,213,201,0.10)',
        color: 'var(--timberwolf)',
        boxShadow:
          'inset 0 0 0 1px rgba(214,213,201,0.35), inset 0 1px 0 rgba(214,213,201,0.06)',
      }}
    >
      <ShieldCheck
        className="h-4 w-4 fill-current"
        style={{ color: 'var(--timberwolf)' }}
        aria-hidden
      />
      <span>{inline}</span>
    </span>
  );
}
