'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  label: string;
  visibility: Visibility;
  variantType: string;
}

function VARIANT_LABEL(t: string, sportName: string | null): string {
  if (t === 'player' && sportName) {
    return sportName.charAt(0).toUpperCase() + sportName.slice(1) + ' player';
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function VISIBILITY_DESCRIPTION(v: Visibility): string {
  switch (v) {
    case 'public':
      return 'Anyone with the link can view';
    case 'authenticated':
      return 'Only signed-in PLAYBACK users';
    case 'club_only':
      return 'Only members of selected clubs';
    case 'private':
      return 'Hidden from everyone but you';
  }
}

export default function DashboardSettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const [variants, setVariants] = useState<SettingsVariant[]>([]);
  const [loading, setLoading] = useState(true);

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
          label: VARIANT_LABEL(
            v.variant_type as string,
            (sport?.name as string | null) ?? null
          ),
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
            <ChevronLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <h1
            className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: 'var(--timberwolf)' }}
          >
            Settings
          </h1>
          <p
            className="mt-1 text-sm max-w-prose"
            style={{ color: 'var(--text-muted)' }}
          >
            Control who sees your profile and how PLAYBACK reaches you.
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
              Module visibility
            </h2>
            <p
              className="text-xs mt-1 max-w-prose"
              style={{ color: 'var(--text-muted)' }}
            >
              Each module on your profile has its own visibility. Public modules
              appear at /p/{profile.data?.username ?? '<username>'} for anyone
              with the link.
            </p>
          </div>
          {variants.length === 0 ? (
            <div className="px-5 sm:px-6 py-6">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                You don&apos;t have any modules yet. Create a player or coach
                module from the dashboard.
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
                      {variant.label}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {VISIBILITY_DESCRIPTION(variant.visibility)}
                    </div>
                  </div>
                  <div className="w-full sm:w-56 shrink-0">
                    <ModulePrivacySwitch
                      variantId={variant.variantId}
                      initialVisibility={variant.visibility}
                      variantLabel={variant.label}
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
          title="Notifications"
          body="Email and push alerts when a coach attributes a clip, issues a verification, or invites you to a roster."
          chip="Coming soon"
        />

        {/* Parental controls — v1.1 stub */}
        <PlaceholderSection
          Icon={Users}
          title="Parental controls"
          body="If you manage a minor's profile, you'll be able to require consent for new attributions, set default visibility, and approve verifications from this section."
          chip="Coming soon"
        />

        <div className="pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Sign out
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
