'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Trophy,
  User as UserIcon,
  Crown,
  Pencil,
  Eye,
  Lock,
  Users,
  Building2,
  Globe,
} from 'lucide-react';
import { DashboardSection } from './dashboard-section';

type Visibility = 'public' | 'authenticated' | 'club_only' | 'private';

export interface ModuleRow {
  variantId: string;
  moduleSlug: string;
  variantType: 'player' | 'coach' | string;
  label: string;
  visibility: Visibility;
  isActive: boolean;
}

interface DashboardModulesSectionProps {
  username: string;
  modules: ModuleRow[];
  onEditModule: (variantId: string) => void;
  /**
   * Day-1 CTA when no modules exist yet. Wired by the dashboard parent to
   * open the player profile creation Sheet (or whichever module-picker
   * Phase 8 introduces).
   */
  onCreateFirstModule?: () => void;
}

const VARIANT_ICON: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  player: Trophy,
  coach: UserIcon,
  club_admin: Crown,
};

const VISIBILITY_CONFIG: Record<
  Visibility,
  {
    labelKey: 'public' | 'authenticated' | 'clubOnly' | 'private';
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  public: { labelKey: 'public', Icon: Globe },
  authenticated: { labelKey: 'authenticated', Icon: Users },
  club_only: { labelKey: 'clubOnly', Icon: Building2 },
  private: { labelKey: 'private', Icon: Lock },
};

/**
 * Lists every active module on the player's profile with a visibility pill +
 * View public + Edit pencil. The dashboard's "what surfaces do I have"
 * answer. Phase 7 surfaces existing modules; Phase 8 adds the per-module
 * edit Sheet that the pencil opens (today it falls back to the global edit).
 */
export function DashboardModulesSection({
  username,
  modules,
  onEditModule,
  onCreateFirstModule,
}: DashboardModulesSectionProps) {
  const t = useTranslations('dashboard.modules');
  return (
    <DashboardSection title={t('title')} count={modules.length || null}>
      {modules.length === 0 ? (
        // Day-1 empty state has a real CTA — Modules is the one section the
        // user can act on themselves to unblock the rest of the dashboard.
        <div className="space-y-3 max-w-prose">
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-subtle)' }}
          >
            {t('empty')}
          </p>
          {onCreateFirstModule && (
            <button
              type="button"
              onClick={onCreateFirstModule}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium border transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--timberwolf)]/50"
              style={{
                backgroundColor: 'var(--surface-1)',
                borderColor: 'var(--line-strong)',
                color: 'var(--timberwolf)',
              }}
            >
              {t('setUpFirst')}
            </button>
          )}
        </div>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--surface-1)',
            borderColor: 'var(--line)',
          }}
        >
          <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {modules.map((m) => {
              const Icon = VARIANT_ICON[m.variantType] ?? UserIcon;
              const visibility = VISIBILITY_CONFIG[m.visibility];
              const VIcon = visibility.Icon;
              const isPublic = m.visibility === 'public';
              return (
                <li
                  key={m.variantId}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5"
                >
                  <div
                    className="rounded-lg p-2 shrink-0"
                    style={{
                      backgroundColor: 'var(--surface-2)',
                      color: 'var(--timberwolf)',
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      {m.label}
                    </div>
                    <div
                      className="mt-0.5 inline-flex items-center gap-1 text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <VIcon className="h-3 w-3" aria-hidden />
                      <span>{t(`visibility.${visibility.labelKey}`)}</span>
                    </div>
                  </div>
                  {/* Reserve the Eye column even when the module isn't
                      public so rows align across the list (premium-ui flag). */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isPublic && username ? (
                      <Link
                        href={`/p/${username}/${m.moduleSlug}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--surface-2)] transition-colors motion-reduce:transition-none"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label={t('viewPublicAria', { label: m.label })}
                        title={t('viewPublicPage')}
                      >
                        <Eye className="h-4 w-4" aria-hidden />
                      </Link>
                    ) : (
                      <span className="w-8 h-8" aria-hidden />
                    )}
                    <button
                      type="button"
                      onClick={() => onEditModule(m.variantId)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--surface-2)] transition-colors motion-reduce:transition-none"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label={t('editAria', { label: m.label })}
                      title={t('editTitle', { label: m.label })}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </DashboardSection>
  );
}
