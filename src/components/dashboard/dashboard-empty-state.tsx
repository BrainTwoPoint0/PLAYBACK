'use client';

import { useTranslations } from 'next-intl';
import { Film, Users } from 'lucide-react';

interface DashboardEmptyStateProps {
  /**
   * True when the player has at least one active variant (player module set
   * up). False = brand-new account with no module yet — show a different
   * message that points them at module creation.
   */
  hasAnyVariant: boolean;
}

/**
 * Day-1 empty state. Two variants:
 * - Has module, no clips yet: "waiting for footage" (the connective-tissue
 *   model is set up; clubs just haven't sent anything)
 * - No module yet: nudge toward setup
 *
 * Intentionally roomy and editorial, not a centered card. The player needs
 * to understand the dependency chain (coach must roster you + lock jersey
 * map), so the copy is two paragraphs not a one-liner.
 */
export function DashboardEmptyState({
  hasAnyVariant,
}: DashboardEmptyStateProps) {
  const t = useTranslations('dashboard.emptyState');
  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-1)',
        borderColor: 'var(--line)',
      }}
    >
      <div
        className="aspect-[16/7] sm:aspect-[16/5] relative flex items-center justify-center"
        style={{
          backgroundColor: 'var(--surface-2)',
          backgroundImage:
            'radial-gradient(circle at 30% 30%, rgba(214,213,201,0.05), transparent 60%), radial-gradient(circle, rgba(214,213,201,0.04) 1px, transparent 1px)',
          backgroundSize: 'auto, 24px 24px',
        }}
      >
        <div
          className="rounded-full p-4"
          style={{
            backgroundColor: 'rgba(214,213,201,0.06)',
            boxShadow: 'inset 0 0 0 1px rgba(214,213,201,0.08)',
          }}
        >
          {hasAnyVariant ? (
            <Film className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
          ) : (
            <Users className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-8 space-y-3 max-w-prose">
        <h2
          className="text-xl font-semibold tracking-tight"
          style={{ color: 'var(--timberwolf)' }}
        >
          {hasAnyVariant ? t('titleHasVariant') : t('titleNoVariant')}
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          {hasAnyVariant ? t('bodyHasVariant') : t('bodyNoVariant')}
        </p>
        {hasAnyVariant && (
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-subtle)' }}
          >
            {t('tip')}
          </p>
        )}
      </div>
    </section>
  );
}
