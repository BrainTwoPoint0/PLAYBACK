'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth, useProfile } from '@braintwopoint0/playback-commons/auth';
import { Button, LumaSpin } from '@braintwopoint0/playback-commons/ui';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ModulePrivacySwitch } from '@/components/profile/module-privacy-switch';
import { ChevronLeft, Bell, Users, LogOut } from 'lucide-react';

type Visibility = 'public' | 'authenticated' | 'club_only' | 'private';

interface SettingsVariant {
  variantId: string;
  moduleSlug: string;
  sportName: string | null;
  visibility: Visibility;
  variantType: string;
}

export default function DashboardSettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const t = useTranslations('dashboard.settings');
  const tc = useTranslations('dashboard.common');
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const [variants, setVariants] = useState<SettingsVariant[]>([]);
  const [loading, setLoading] = useState(true);

  // Label is computed at render (not stored in state) so it re-translates on
  // locale change. Sport names come from the DB in English and are
  // interpolated as-is.
  const variantLabel = (variantType: string, sportName: string | null) => {
    if (variantType === 'player') {
      return sportName
        ? t('playerWithSport', {
            sport: sportName.charAt(0).toUpperCase() + sportName.slice(1),
          })
        : t('variantPlayer');
    }
    if (variantType === 'coach') return t('variantCoach');
    return variantType.charAt(0).toUpperCase() + variantType.slice(1);
  };

  const visibilityDescription = (v: Visibility): string => {
    switch (v) {
      case 'public':
        return t('visibilityPublic');
      case 'authenticated':
        return t('visibilityAuthenticated');
      case 'club_only':
        return t('visibilityClubOnly');
      case 'private':
        return t('visibilityPrivate');
    }
  };

  useEffect(() => {
    const profileId = profile.data?.id;
    if (!profileId) return;
    let cancelled = false;
    (async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: variantRows } = await (supabase as any)
        .from('profile_variants')
        .select(
          'id, variant_type, module_slug, sport_id, sports:sport_id (id, name)'
        )
        .eq('profile_id', profileId)
        .eq('is_active', true);
      const list = (variantRows ?? []) as any[];
      if (list.length === 0) {
        if (!cancelled) {
          setVariants([]);
          setLoading(false);
        }
        return;
      }
      const ids = list.map((v) => v.id as string);
      const { data: privacyRows } = await (supabase as any)
        .from('profile_module_privacies')
        .select('profile_variant_id, visibility')
        .in('profile_variant_id', ids);
      const privacyByVariant = new Map<string, Visibility>(
        ((privacyRows ?? []) as any[]).map((p) => [
          p.profile_variant_id,
          p.visibility as Visibility,
        ])
      );
      const mapped: SettingsVariant[] = list.map((v) => {
        const sport = Array.isArray(v.sports) ? v.sports[0] : v.sports;
        return {
          variantId: v.id as string,
          moduleSlug: v.module_slug as string,
          sportName: (sport?.name as string | null) ?? null,
          variantType: v.variant_type as string,
          visibility: (privacyByVariant.get(v.id as string) ??
            'public') as Visibility,
        };
      });
      if (!cancelled) {
        setVariants(mapped);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.data?.id]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--night)' }}
      >
        <LumaSpin />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            {t('backToDashboard')}
          </Link>
          <h1
            className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: 'var(--timberwolf)' }}
          >
            {t('title')}
          </h1>
          <p
            className="mt-1 text-sm max-w-prose"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('subtitle')}
          </p>
        </div>

        {/* Module visibility */}
        <section
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--surface-1)',
            borderColor: 'var(--line)',
          }}
        >
          <div
            className="px-5 sm:px-6 py-4 border-b"
            style={{ borderColor: 'var(--line)' }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ color: 'var(--timberwolf)' }}
            >
              {t('moduleVisibilityTitle')}
            </h2>
            <p
              className="text-xs mt-1 max-w-prose"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.rich('moduleVisibilityDescription', {
                username: profile.data?.username ?? '<username>',
                path: (chunks) => <span dir="ltr">{chunks}</span>,
              })}
            </p>
          </div>
          {variants.length === 0 ? (
            <div className="px-5 sm:px-6 py-6">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {t('noModules')}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {variants.map((variant) => (
                <div
                  key={variant.variantId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 sm:px-6 py-4"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div className="min-w-0">
                    <div
                      className="text-sm font-medium"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      {variantLabel(variant.variantType, variant.sportName)}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {visibilityDescription(variant.visibility)}
                    </div>
                  </div>
                  <div className="w-full sm:w-56 shrink-0">
                    <ModulePrivacySwitch
                      variantId={variant.variantId}
                      initialVisibility={variant.visibility}
                      variantLabel={variantLabel(
                        variant.variantType,
                        variant.sportName
                      )}
                      onChange={(v) =>
                        setVariants((prev) =>
                          prev.map((x) =>
                            x.variantId === variant.variantId
                              ? { ...x, visibility: v }
                              : x
                          )
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notifications — v1.1 stub */}
        <PlaceholderSection
          Icon={Bell}
          title={t('notificationsTitle')}
          body={t('notificationsBody')}
          chip={tc('comingSoon')}
        />

        {/* Parental controls — v1.1 stub */}
        <PlaceholderSection
          Icon={Users}
          title={t('parentalTitle')}
          body={t('parentalBody')}
          chip={tc('comingSoon')}
        />

        <div className="pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
          >
            <LogOut className="h-4 w-4 me-1.5" />
            {tc('signOut')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlaceholderSection({
  Icon,
  title,
  body,
  chip,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  chip: string;
}) {
  return (
    <section
      className="rounded-2xl border px-5 sm:px-6 py-5 flex items-start gap-4"
      style={{
        backgroundColor: 'var(--surface-1)',
        borderColor: 'var(--line)',
      }}
    >
      <div
        className="rounded-lg p-2 shrink-0"
        style={{ backgroundColor: 'rgba(214,213,201,0.05)' }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--timberwolf)' }}
          >
            {title}
          </h3>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider border"
            style={{
              borderColor: 'var(--line-strong)',
              color: 'var(--text-subtle)',
            }}
          >
            {chip}
          </span>
        </div>
        <p
          className="mt-1 text-xs leading-relaxed max-w-prose"
          style={{ color: 'var(--text-muted)' }}
        >
          {body}
        </p>
      </div>
    </section>
  );
}
