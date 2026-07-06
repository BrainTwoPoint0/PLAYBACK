import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { PublicVariant } from '@/lib/profile/get-public-profile';

interface ProfileModuleSwitcherProps {
  username: string;
  variants: PublicVariant[];
  activeModuleSlug: string;
}

// Variant types with a translated label under `profileLabels.variants.*`.
// Unknown types fall back to the raw variant_type string.
const KNOWN_VARIANT_TYPES = [
  'player',
  'coach',
  'scout',
  'agent',
  'referee',
  'trainer',
  'physio',
] as const;

export function ProfileModuleSwitcher({
  username,
  variants,
  activeModuleSlug,
}: ProfileModuleSwitcherProps) {
  const t = useTranslations('profile.moduleSwitcher');
  const tVariants = useTranslations('profileLabels.variants');

  function labelFor(variant: PublicVariant): string {
    if (variant.display_name) return variant.display_name;
    if (variant.sport_name && variant.variant_type === 'player') {
      return (
        variant.sport_name.charAt(0).toUpperCase() + variant.sport_name.slice(1)
      );
    }
    return (KNOWN_VARIANT_TYPES as readonly string[]).includes(
      variant.variant_type
    )
      ? tVariants(variant.variant_type)
      : variant.variant_type;
  }

  if (variants.length <= 1) return null;

  return (
    <nav
      aria-label={t('ariaLabel')}
      className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-[var(--timberwolf)]/[0.04] border border-[var(--timberwolf)]/15"
    >
      {variants.map((variant) => {
        const isActive = variant.module_slug === activeModuleSlug;
        const href = `/p/${username}/${variant.module_slug}`;
        return (
          <Link
            key={variant.id}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-full',
              'transition-all duration-200 ease-out',
              isActive
                ? 'bg-[var(--timberwolf)] text-[var(--night)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-[var(--timberwolf)]/80 hover:text-[var(--timberwolf)] hover:bg-[var(--timberwolf)]/[0.06]'
            )}
          >
            {labelFor(variant)}
          </Link>
        );
      })}
    </nav>
  );
}
