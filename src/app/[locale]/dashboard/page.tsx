'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import {
  useAuth,
  useProfile,
  useOnboardingStatus,
} from '@braintwopoint0/playback-commons/auth';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button, LumaSpin } from '@braintwopoint0/playback-commons/ui';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PlayerProfileForm } from '@/components/profile/player-profile-form';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { DashboardTopBar } from '@/components/dashboard/dashboard-top-bar';
import { DashboardFeed } from '@/components/dashboard/dashboard-feed';
import { DashboardEmptyState } from '@/components/dashboard/dashboard-empty-state';
import { DashboardModulesSection } from '@/components/dashboard/dashboard-modules-section';
import { DashboardVerificationsSection } from '@/components/dashboard/dashboard-verifications-section';
import { DashboardAccessSection } from '@/components/dashboard/dashboard-access-section';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { EditProfileSheet } from '@/components/dashboard/edit-profile-sheet';
import {
  Input,
  Label,
  Checkbox,
  DatePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@braintwopoint0/playback-commons/ui';
// Local Textarea (not the commons one): commons Textarea uses ShadCN theme
// tokens (`bg-background`, `border-input`) that don't resolve in PLAYBACK's
// theme and fall back to light/white — visually inconsistent with the
// dark Input. The local component is brand-matched (zinc-800 + timberwolf
// hover gradient).
import { Textarea } from '@/components/ui/textarea';
import { VideoUpload } from '@/components/video/video-upload';
import { HighlightVideoDialog } from '@/components/video/highlight-video-dialog';
import {
  createHighlight,
  deleteHighlight,
  importRecordingAsHighlight,
  addCareerEntry,
  updateCareerEntry,
  deleteCareerEntry,
  addEducationEntry,
  updateEducationEntry,
  deleteEducationEntry,
  type CareerEntryInput,
  type EducationEntryInput,
} from '@/lib/profile/actions';
import { createBrowserClient } from '@supabase/ssr';
import { FadeIn } from '@/components/FadeIn';
import {
  LogOut,
  Instagram,
  Twitter,
  Linkedin,
  CheckCircle,
  ExternalLink,
  Play,
  Plus,
  Film,
} from 'lucide-react';

// SocialLink Component (from public profile)
function SocialLink({
  platform,
  username,
}: {
  platform: string;
  username: string;
}) {
  const socialConfig = {
    instagram: {
      icon: Instagram,
      url: `https://instagram.com/${username}`,
      color: 'text-pink-400 hover:text-pink-300',
    },
    twitter: {
      icon: Twitter,
      url: `https://twitter.com/${username}`,
      color: 'text-sky-400 hover:text-sky-300',
    },
    linkedin: {
      icon: Linkedin,
      url: `https://linkedin.com/in/${username}`,
      color: 'text-blue-400 hover:text-blue-300',
    },
  };

  const config = socialConfig[platform as keyof typeof socialConfig];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <a
      href={config.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-3 rounded-xl bg-neutral-800/30 border border-neutral-700/50 hover:border-neutral-600 transition-all duration-300 hover:bg-neutral-800/50 group ${config.color}`}
    >
      <Icon className="h-5 w-5" />
      <span
        dir="ltr"
        className="text-sm font-medium"
        style={{ color: 'var(--timberwolf)' }}
      >
        @{username}
      </span>
      <ExternalLink className="h-4 w-4 ms-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 rtl:-scale-x-100" />
    </a>
  );
}

function CareerEntryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: any | null;
  onSave: (
    input: CareerEntryInput
  ) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}) {
  const t = useTranslations('dashboard.careerForm');
  const tc = useTranslations('dashboard.common');
  const [orgName, setOrgName] = useState(initial?.organization_name || '');
  const [role, setRole] = useState(initial?.role || '');
  const [startDate, setStartDate] = useState(initial?.start_date || '');
  const [endDate, setEndDate] = useState(initial?.end_date || '');
  const [isCurrent, setIsCurrent] = useState(initial?.is_current || false);
  const [description, setDescription] = useState(initial?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!orgName.trim()) {
      setError(t('errorOrgRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    const result = await onSave({
      organization_name: orgName,
      role: role || null,
      start_date: startDate || null,
      end_date: endDate || null,
      is_current: isCurrent,
      description: description || null,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error || tc('saveFailed'));
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-5"
    >
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="career-org" className="text-[var(--timberwolf)]">
          {t('organization')} <span className="text-red-400">*</span>
        </Label>
        <Input
          id="career-org"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          maxLength={255}
          placeholder={t('organizationPlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="career-role" className="text-[var(--timberwolf)]">
          {t('role')}
        </Label>
        <Input
          id="career-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          maxLength={100}
          placeholder={t('rolePlaceholder')}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="career-start" className="text-[var(--timberwolf)]">
            {t('startDate')}
          </Label>
          <DatePicker
            id="career-start"
            value={startDate}
            onChange={setStartDate}
            placeholder={tc('selectDate')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="career-end" className="text-[var(--timberwolf)]">
            {t('endDate')}
          </Label>
          <DatePicker
            id="career-end"
            value={isCurrent ? '' : endDate}
            onChange={setEndDate}
            placeholder={isCurrent ? t('currentlyHere') : tc('selectDate')}
            min={startDate || undefined}
          />
        </div>
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <Checkbox
          checked={isCurrent}
          onCheckedChange={(c) => setIsCurrent(c === true)}
        />
        <span className="text-sm text-[var(--timberwolf)]">
          {t('currentlyHere')}
        </span>
      </label>
      <div className="space-y-2">
        <Label htmlFor="career-desc" className="text-[var(--timberwolf)]">
          {t('description')}
        </Label>
        <Textarea
          id="career-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder={t('descriptionPlaceholder')}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-[var(--ash-grey)] hover:text-[var(--timberwolf)]"
        >
          {tc('cancel')}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={saving}
          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
        >
          {saving ? <LoadingSpinner size="sm" /> : tc('save')}
        </Button>
      </div>
    </form>
  );
}

function EducationEntryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: any | null;
  onSave: (
    input: EducationEntryInput
  ) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}) {
  const t = useTranslations('dashboard.educationForm');
  const tc = useTranslations('dashboard.common');
  const [institutionName, setInstitutionName] = useState(
    initial?.institution_name || ''
  );
  const [institutionType, setInstitutionType] = useState(
    initial?.institution_type || ''
  );
  const [degree, setDegree] = useState(initial?.degree_or_program || '');
  const [fieldOfStudy, setFieldOfStudy] = useState(
    initial?.field_of_study || ''
  );
  const [startDate, setStartDate] = useState(initial?.start_date || '');
  const [endDate, setEndDate] = useState(initial?.end_date || '');
  const [isCurrent, setIsCurrent] = useState(initial?.is_current || false);
  const [description, setDescription] = useState(initial?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!institutionName.trim()) {
      setError(t('errorInstitutionRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    const result = await onSave({
      institution_name: institutionName,
      institution_type: institutionType || null,
      degree_or_program: degree || null,
      field_of_study: fieldOfStudy || null,
      start_date: startDate || null,
      end_date: endDate || null,
      is_current: isCurrent,
      description: description || null,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error || tc('saveFailed'));
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-5"
    >
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="edu-inst" className="text-[var(--timberwolf)]">
          {t('institution')} <span className="text-red-400">*</span>
        </Label>
        <Input
          id="edu-inst"
          value={institutionName}
          onChange={(e) => setInstitutionName(e.target.value)}
          maxLength={255}
          placeholder={t('institutionPlaceholder')}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edu-type" className="text-[var(--timberwolf)]">
            {t('type')}
          </Label>
          <Select
            value={institutionType || undefined}
            onValueChange={(v) => setInstitutionType(v === '__none__' ? '' : v)}
          >
            <SelectTrigger id="edu-type" className="w-full">
              <SelectValue placeholder={t('selectType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="school">{t('typeSchool')}</SelectItem>
              <SelectItem value="college">{t('typeCollege')}</SelectItem>
              <SelectItem value="university">{t('typeUniversity')}</SelectItem>
              <SelectItem value="academy">{t('typeAcademy')}</SelectItem>
              <SelectItem value="other">{t('typeOther')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edu-degree" className="text-[var(--timberwolf)]">
            {t('degree')}
          </Label>
          <Input
            id="edu-degree"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            maxLength={255}
            placeholder={t('degreePlaceholder')}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edu-field" className="text-[var(--timberwolf)]">
          {t('fieldOfStudy')}
        </Label>
        <Input
          id="edu-field"
          value={fieldOfStudy}
          onChange={(e) => setFieldOfStudy(e.target.value)}
          maxLength={255}
          placeholder={t('fieldOfStudyPlaceholder')}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edu-start" className="text-[var(--timberwolf)]">
            {t('startDate')}
          </Label>
          <DatePicker
            id="edu-start"
            value={startDate}
            onChange={setStartDate}
            placeholder={tc('selectDate')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edu-end" className="text-[var(--timberwolf)]">
            {t('endDate')}
          </Label>
          <DatePicker
            id="edu-end"
            value={isCurrent ? '' : endDate}
            onChange={setEndDate}
            placeholder={isCurrent ? t('currentlyAttending') : tc('selectDate')}
            min={startDate || undefined}
          />
        </div>
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <Checkbox
          checked={isCurrent}
          onCheckedChange={(c) => setIsCurrent(c === true)}
        />
        <span className="text-sm text-[var(--timberwolf)]">
          {t('currentlyAttending')}
        </span>
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-[var(--ash-grey)] hover:text-[var(--timberwolf)]"
        >
          {tc('cancel')}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={saving}
          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
        >
          {saving ? <LoadingSpinner size="sm" /> : tc('save')}
        </Button>
      </div>
    </form>
  );
}

function DashboardContent() {
  const t = useTranslations('dashboard');
  const format = useFormatter();
  const { user, signOut, loading } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const onboardingStatus = useOnboardingStatus();
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [hasPlayerVariant, setHasPlayerVariant] = useState(false);
  const [footballData, setFootballData] = useState<{
    experience_level: string;
    preferred_foot: string | null;
    primary_position: string | null;
    secondary_positions: string[] | null;
    preferred_jersey_number: number | null;
  } | null>(null);
  const [highlightsCount, setHighlightsCount] = useState(0);
  const [playerVariantId, setPlayerVariantId] = useState<string | null>(null);
  // Module visibility for the player variant — drives the privacy switch +
  // determines whether the module is shareable. Fetched in checkPlayerVariant.
  const [playerVariantVisibility, setPlayerVariantVisibility] = useState<
    'public' | 'authenticated' | 'club_only' | 'private'
  >('public');
  const [playerModuleSlug, setPlayerModuleSlug] = useState<string | null>(null);
  // Phase 6 dashboard state — recent attributed clips + verifications drive
  // the new hero + activity feed + sidebar stats. All fetched alongside the
  // existing variant flow in checkPlayerVariant.
  const [attributedClips, setAttributedClips] = useState<
    {
      attributionId: string;
      recordingId: string;
      recordingTitle: string;
      homeTeam: string;
      awayTeam: string;
      matchDate: string;
      thumbnailUrl: string | null;
      type: 'goal' | 'assist' | 'save' | 'tackle' | 'skill' | 'custom';
      title: string | null;
      attributedAt: string;
      ownerOrgName: string | null;
    }[]
  >([]);
  const [profileVerifications, setProfileVerifications] = useState<
    {
      id: string;
      organizationName: string;
      seasonLabel: string | null;
      verifiedAt: string;
    }[]
  >([]);
  // Phase 7.1 — `last_dashboard_view_at` snapshot taken at first fetch.
  // Frozen for the session so NEW pills don't disappear mid-scroll. The
  // post-paint write below pushes a fresh `now()` server-side; subsequent
  // refreshes start with the new baseline.
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  // Track the profile id we last fetched lastSeenAt for. When the user signs
  // out + a different user signs in within the same component instance, the
  // id changes and the next checkPlayerVariant pass re-fetches. A boolean
  // would have left the previous user's value bleeding through.
  const lastSeenFetchedFor = useRef<string | null>(null);
  // Phase 7 — PLAYHUB ecosystem summary (access rights + purchases). Read
  // directly from the shared Supabase project; both tables RLS-gated to the
  // owning auth.uid() so cross-tenant leakage isn't possible.
  const [accessSummary, setAccessSummary] = useState<{
    recordingsAccessibleCount: number;
    latestGrantedAt: string | null;
    totalPurchases: number;
    latestPurchasedAt: string | null;
    latestPurchaseAmount: number | null;
    latestPurchaseCurrency: string | null;
  }>({
    recordingsAccessibleCount: 0,
    latestGrantedAt: null,
    totalPurchases: 0,
    latestPurchasedAt: null,
    latestPurchaseAmount: null,
    latestPurchaseCurrency: null,
  });
  const [highlights, setHighlights] = useState<
    {
      id: string;
      title: string;
      thumbnail_url: string | null;
      video_url: string;
      duration: number | null;
      metadata: Record<string, unknown> | null;
    }[]
  >([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadedVideoData, setUploadedVideoData] = useState<{
    url: string;
    thumbnail: string;
    duration: number;
  } | null>(null);
  const [savingHighlight, setSavingHighlight] = useState(false);
  const [showPlayhubPicker, setShowPlayhubPicker] = useState(false);
  const [playhubRecordings, setPlayhubRecordings] = useState<
    {
      id: string;
      title: string;
      thumbnail_url: string | null;
      match_date: string;
      home_team: string;
      away_team: string;
      content_type: string;
      duration_seconds: number | null;
    }[]
  >([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  // Career & Education state
  const [careerEntries, setCareerEntries] = useState<any[]>([]);
  const [educationEntries, setEducationEntries] = useState<any[]>([]);
  const [showCareerDialog, setShowCareerDialog] = useState(false);
  const [showEducationDialog, setShowEducationDialog] = useState(false);
  const [editingCareerEntry, setEditingCareerEntry] = useState<any | null>(
    null
  );
  const [editingEducationEntry, setEditingEducationEntry] = useState<
    any | null
  >(null);
  const [activeHighlight, setActiveHighlight] = useState<{
    id: string;
    title: string;
    video_url: string;
    thumbnail_url: string | null;
    metadata: Record<string, unknown> | null;
  } | null>(null);

  // Check if user has a player variant and fetch football data
  const checkPlayerVariant = useCallback(async () => {
    if (!profile.data?.id) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    // .maybeSingle() — a brand-new user with no variant yet is the normal
    // first-run case. .single() surfaced a 406 in Supabase telemetry on
    // every dashboard navigation until the user created a variant.
    // is_active=true: a soft-deactivated variant should not appear on the
    // dashboard (settings page + public profile already filter on it).
    const { data: variant } = await supabase
      .from('profile_variants')
      .select('id, module_slug')
      .eq('profile_id', profile.data.id)
      .eq('variant_type', 'player')
      .eq('is_active', true)
      .maybeSingle();
    setHasPlayerVariant(!!variant);

    if (variant) {
      const typedVariant = variant as unknown as {
        id: string;
        module_slug: string;
      };
      setPlayerVariantId(typedVariant.id);
      setPlayerModuleSlug(typedVariant.module_slug);

      // Pull current privacy so the switch shows the right state on first
      // render. Missing row defaults to 'public' to mirror the AFTER INSERT
      // trigger's default.
      const { data: privacy } = await supabase
        .from('profile_module_privacies')
        .select('visibility')
        .eq('profile_variant_id', typedVariant.id)
        .maybeSingle();
      if (privacy) {
        setPlayerVariantVisibility(
          (privacy as any).visibility as typeof playerVariantVisibility
        );
      }
      // maybeSingle: a player variant without football data yet is normal
      // (day-1 onboarding state) — `.single()` would log a console error.
      const { data: football } = await supabase
        .from('football_player_profiles')
        .select(
          'experience_level, preferred_foot, primary_position, secondary_positions, preferred_jersey_number'
        )
        .eq('profile_variant_id', typedVariant.id)
        .maybeSingle();
      if (football) {
        setFootballData(football as unknown as typeof footballData);
      }

      // Fetch highlights
      const { data: highlightsData, count } = await supabase
        .from('highlights')
        .select('id, title, thumbnail_url, video_url, duration, metadata', {
          count: 'exact',
        })
        .eq('profile_variant_id', typedVariant.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setHighlightsCount(count || 0);
      setHighlights((highlightsData as unknown as typeof highlights) || []);

      // Fetch career history
      const { data: careerData } = await supabase
        .from('career_history')
        .select(
          'id, organization_name, role, start_date, end_date, is_current, description'
        )
        .eq('profile_variant_id', typedVariant.id)
        .order('display_order', { ascending: true });
      setCareerEntries((careerData as any[]) || []);
    }

    // Phase 7.1 — read `last_dashboard_view_at` once per session. Graceful
    // fallback if the column hasn't been migrated yet: the catch leaves
    // lastSeenAt at null, which the cards interpret as "first-ever load"
    // (everything new) — correct day-1 UX even before migration runs.
    if (profile.data?.id && lastSeenFetchedFor.current !== profile.data.id) {
      const fetchingFor = profile.data.id;
      lastSeenFetchedFor.current = fetchingFor;
      // Reset state so the previous user's value can never bleed across.
      setLastSeenAt(null);
      try {
        const { data: lastSeenRow, error: lastSeenError } = await supabase
          .from('profiles')
          .select('last_dashboard_view_at')
          .eq('id', fetchingFor)
          .maybeSingle();
        // If the user changed mid-flight, drop this result.
        if (lastSeenFetchedFor.current !== fetchingFor) {
          // intentional no-op
        } else if (lastSeenError) {
          console.warn(
            'dashboard: last_dashboard_view_at fetch failed (treat as first-load)',
            lastSeenError
          );
        } else {
          setLastSeenAt(lastSeenRow?.last_dashboard_view_at ?? null);
        }
      } catch (e) {
        console.warn(
          'dashboard: last_dashboard_view_at fetch threw (treat as first-load)',
          e
        );
      }
    }

    // Fetch education (uses profile_id, not variant_id)
    if (profile.data?.id) {
      const { data: educationData } = await supabase
        .from('education')
        .select(
          'id, institution_name, institution_type, degree_or_program, field_of_study, start_date, end_date, is_current, description'
        )
        .eq('profile_id', profile.data.id)
        .order('display_order', { ascending: true });
      setEducationEntries((educationData as any[]) || []);

      // Phase 6 — clip attributions for the dashboard hero + activity feed.
      // Mirrors the public profile read path (Phase 5): inner-join clips +
      // recordings, filter to published+non-deleted at the SQL level.
      // Errors are logged but don't block render — empty arrays fall back
      // to the empty-state copy in DashboardHero / DashboardActivityFeed.
      const { data: attributionData, error: attributionError } = await supabase
        .from('clip_attributions')
        .select(
          `id, attributed_at, jersey_number_at_match,
           clips:clip_id!inner (
             id, recording_id, type, title, deleted_at, owner_org_id,
             playhub_match_recordings:recording_id!inner (
               id, title, home_team, away_team, match_date,
               thumbnail_url, status
             ),
             organizations:owner_org_id ( id, name )
           )`
        )
        .eq('profile_id', profile.data.id)
        .is('revoked_at', null)
        .is('clips.deleted_at', null)
        .eq('clips.playhub_match_recordings.status', 'published')
        .order('attributed_at', { ascending: false })
        .limit(24);

      if (attributionError) {
        console.warn(
          'dashboard: clip_attributions fetch failed',
          attributionError
        );
      }

      const mappedClips = ((attributionData ?? []) as any[])
        .map((a) => {
          const clip = Array.isArray(a.clips) ? a.clips[0] : a.clips;
          if (!clip) return null;
          const rec = Array.isArray(clip.playhub_match_recordings)
            ? clip.playhub_match_recordings[0]
            : clip.playhub_match_recordings;
          if (!rec) return null;
          const org = Array.isArray(clip.organizations)
            ? clip.organizations[0]
            : clip.organizations;
          return {
            attributionId: a.id as string,
            recordingId: rec.id as string,
            recordingTitle: rec.title as string,
            homeTeam: (rec.home_team as string) ?? '',
            awayTeam: (rec.away_team as string) ?? '',
            matchDate: rec.match_date as string,
            thumbnailUrl: (rec.thumbnail_url as string | null) ?? null,
            type:
              (clip.type as
                | 'goal'
                | 'assist'
                | 'save'
                | 'tackle'
                | 'skill'
                | 'custom') ?? 'custom',
            title: (clip.title as string | null) ?? null,
            attributedAt: a.attributed_at as string,
            ownerOrgName: (org?.name as string | null) ?? null,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);
      setAttributedClips(mappedClips);

      // Active verifications. Multi-club allowed (stack in the list).
      const { data: verificationData, error: verificationError } =
        await supabase
          .from('profile_verifications')
          .select(
            'id, season_label, verified_at, verifying_org_id, organizations:verifying_org_id (id, name)'
          )
          .eq('profile_id', profile.data.id)
          .is('revoked_at', null)
          .order('verified_at', { ascending: false });

      if (verificationError) {
        console.warn(
          'dashboard: profile_verifications fetch failed',
          verificationError
        );
      }

      const mappedVerifs = ((verificationData ?? []) as any[])
        .map((v) => {
          const org = Array.isArray(v.organizations)
            ? v.organizations[0]
            : v.organizations;
          if (!org?.name) return null;
          return {
            id: v.id as string,
            organizationName: org.name as string,
            seasonLabel: (v.season_label as string | null) ?? null,
            verifiedAt: v.verified_at as string,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);
      setProfileVerifications(mappedVerifs);

      // Phase 7 — PLAYHUB ecosystem summary. Owner-only RLS confirmed at
      // current_schema.sql:3715 (access_rights) and :3729 (purchases).
      if (user?.id) {
        const nowIso = new Date().toISOString();
        const [
          { data: accessRows, error: accessError, count: accessCount },
          { data: purchaseRows, error: purchaseError, count: purchaseCount },
        ] = await Promise.all([
          supabase
            .from('playhub_access_rights')
            .select('id, granted_at, expires_at', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('is_active', true)
            .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
            .order('granted_at', { ascending: false })
            .limit(1),
          supabase
            .from('playhub_purchases')
            .select('id, amount_paid, currency, purchased_at', {
              count: 'exact',
            })
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('purchased_at', { ascending: false })
            .limit(1),
        ]);

        if (accessError) {
          console.warn('dashboard: access_rights fetch failed', accessError);
        }
        if (purchaseError) {
          console.warn('dashboard: purchases fetch failed', purchaseError);
        }

        const latestAccess = ((accessRows ?? []) as any[])[0] ?? null;
        const latestPurchase = ((purchaseRows ?? []) as any[])[0] ?? null;

        setAccessSummary({
          recordingsAccessibleCount: accessCount ?? 0,
          latestGrantedAt: (latestAccess?.granted_at as string | null) ?? null,
          totalPurchases: purchaseCount ?? 0,
          latestPurchasedAt:
            (latestPurchase?.purchased_at as string | null) ?? null,
          latestPurchaseAmount: latestPurchase?.amount_paid
            ? Number(latestPurchase.amount_paid)
            : null,
          latestPurchaseCurrency:
            (latestPurchase?.currency as string | null) ?? null,
        });
      }
    }
  }, [profile.data?.id, user?.id]);

  useEffect(() => {
    checkPlayerVariant();
  }, [checkPlayerVariant]);

  // Phase 7.1 — push `last_dashboard_view_at = now()` ~3s after the dashboard
  // mounts so the user has a real chance to see the NEW pulses before the
  // server gets the fresh timestamp. Run once per page-load. Errors are
  // non-fatal — RLS owner-only on profiles already gates this; if the column
  // hasn't been migrated yet the UPDATE simply fails (PostgREST rejects
  // unknown columns) and the next session keeps showing NEW pills.
  //
  // Cross-user safety: the effect's dep is `profile.data?.id`; on signOut →
  // sign-in-as-different-user the dep changes and the cleanup `clearTimeout`
  // cancels the pending write before it fires. We additionally cross-check
  // against `lastSeenFetchedFor.current` (a ref updated on each fetch) so a
  // mid-flight identity swap is caught even if the timer somehow survives.
  useEffect(() => {
    if (!profile.data?.id) return;
    const profileId = profile.data.id;
    const handle = setTimeout(async () => {
      // Latest-fetch ref is the single source of truth for "who's the
      // current user", refreshed on every checkPlayerVariant pass. If it
      // doesn't match, a faster identity swap happened and we'd be writing
      // the wrong row.
      if (lastSeenFetchedFor.current !== profileId) return;
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data, error } = await supabase
          .from('profiles')
          .update({ last_dashboard_view_at: new Date().toISOString() })
          .eq('id', profileId)
          .select('id')
          .maybeSingle();
        if (error) {
          console.warn('dashboard: last_dashboard_view_at write failed', error);
        } else if (!data) {
          // 0 rows updated — RLS rejected the row, profile was deleted, or
          // the column doesn't exist yet. Logged so this isn't silent.
          console.warn(
            'dashboard: last_dashboard_view_at write hit 0 rows for',
            profileId
          );
        }
      } catch (e) {
        console.warn('dashboard: last_dashboard_view_at write threw', e);
      }
    }, 3000);
    return () => clearTimeout(handle);
  }, [profile.data?.id]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSaveHighlight = async () => {
    if (!uploadedVideoData || !uploadTitle.trim()) return;
    setSavingHighlight(true);
    const result = await createHighlight({
      title: uploadTitle.trim(),
      video_url: uploadedVideoData.url,
      thumbnail_url: uploadedVideoData.thumbnail || null,
      description: uploadDescription.trim() || null,
      duration: uploadedVideoData.duration || null,
    });
    setSavingHighlight(false);
    if (result.success) {
      setShowUploadDialog(false);
      setUploadTitle('');
      setUploadDescription('');
      setUploadedVideoData(null);
      checkPlayerVariant();
    }
  };

  const handleDeleteHighlight = async (highlightId: string) => {
    const result = await deleteHighlight(highlightId);
    if (result.success) {
      checkPlayerVariant();
    }
  };

  const fetchPlayhubRecordings = useCallback(async () => {
    setLoadingRecordings(true);
    try {
      const res = await fetch('/api/recordings/accessible');
      if (res.ok) {
        const data = await res.json();
        setPlayhubRecordings(data.recordings || []);
      }
    } catch {
      // Silently fail - user may not have PLAYHUB access
    }
    setLoadingRecordings(false);
  }, []);

  const handleImportRecording = async (recordingId: string) => {
    setImportingId(recordingId);
    const result = await importRecordingAsHighlight(recordingId);
    setImportingId(null);
    if (result.success) {
      checkPlayerVariant();
      fetchPlayhubRecordings();
    }
  };

  useEffect(() => {
    if (showPlayhubPicker) {
      fetchPlayhubRecordings();
    }
  }, [showPlayhubPicker, fetchPlayhubRecordings]);

  if (loading || onboardingStatus.loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LumaSpin />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: 'var(--night)' }}
    >
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--timberwolf) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        {/* v6.1 layout — match-grouped feed (Veo / Hudl baseline).
            Single column. Top bar carries identity + actions; feed groups
            attributed clips by recording. No tabs, no sidebar, no completion
            bar. Settings live at /dashboard/settings. */}
        <FadeIn>
          <DashboardTopBar
            username={profile.data?.username ?? ''}
            fullName={profile.data?.full_name ?? null}
            firstName={profile.data?.full_name?.split(' ')[0] || ''}
            avatarUrl={profile.data?.avatar_url ?? null}
            verifications={profileVerifications.map((v) => ({
              id: v.id,
              organizationName: v.organizationName,
            }))}
            publicVariants={
              hasPlayerVariant && playerVariantId && playerModuleSlug
                ? [
                    {
                      variantId: playerVariantId,
                      moduleSlug: playerModuleSlug,
                      label: t('page.playerModuleLabel'),
                      visibility: playerVariantVisibility,
                    },
                  ]
                : []
            }
            onEditProfile={() => {
              if (hasPlayerVariant && footballData) {
                setShowEditForm(true);
              } else {
                setShowPlayerForm(true);
              }
            }}
            onSignOut={handleSignOut}
          />
        </FadeIn>

        {/* Phase 7 — vertical stack of distinct concerns. Match clips +
            modules + verifications are the connective-tissue side; access +
            settings are the account/ecosystem side. Same scroll, no tabs. */}
        <div className="mt-8 space-y-10">
          {/* Match clips — connective-tissue lede */}
          <FadeIn delay={100}>
            {attributedClips.length === 0 ? (
              <DashboardSection title={t('page.matchClips')}>
                <DashboardEmptyState hasAnyVariant={hasPlayerVariant} />
              </DashboardSection>
            ) : (
              <DashboardSection
                title={t('page.matchClips')}
                count={attributedClips.length}
              >
                <DashboardFeed
                  clips={attributedClips}
                  lastSeenAt={lastSeenAt}
                />
              </DashboardSection>
            )}
          </FadeIn>

          {/* Your modules */}
          <FadeIn delay={150}>
            <DashboardModulesSection
              username={profile.data?.username ?? ''}
              modules={
                hasPlayerVariant && playerVariantId && playerModuleSlug
                  ? [
                      {
                        variantId: playerVariantId,
                        moduleSlug: playerModuleSlug,
                        variantType: 'player',
                        label: t('page.playerProfileLabel'),
                        visibility: playerVariantVisibility,
                        isActive: true,
                      },
                    ]
                  : []
              }
              onEditModule={() => {
                // Phase 8 will route to per-module edit Sheets. Today we
                // open the existing global Edit Profile Sheet for any module.
                if (hasPlayerVariant && footballData) {
                  setShowEditForm(true);
                } else {
                  setShowPlayerForm(true);
                }
              }}
              onCreateFirstModule={() => setShowPlayerForm(true)}
            />
          </FadeIn>

          {/* Verifications */}
          <FadeIn delay={200}>
            <DashboardVerificationsSection
              verifications={profileVerifications}
              lastSeenAt={lastSeenAt}
            />
          </FadeIn>

          {/* Subscriptions & access — PLAYHUB ecosystem */}
          <FadeIn delay={250}>
            <DashboardAccessSection summary={accessSummary} />
          </FadeIn>
        </div>
      </div>

      {/* Dialog cluster — the Highlight Upload, PLAYHUB Recordings Picker,
          Career Entry, Education Entry, and Highlight Video dialogs are
          mounted here without active triggers in the new dashboard layout
          (Phase 6 stripped the buttons that opened them). They're preserved
          for Phase 6.1 integration into EditProfileSheet so we don't lose the
          state-management plumbing twice. The Player Profile Creation and
          Profile Edit Sheet ARE active — their triggers live in DashboardSidebar. */}
      {/* Player Profile Creation Dialog */}
      <Dialog open={showPlayerForm} onOpenChange={setShowPlayerForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('page.createPlayerTitle')}</DialogTitle>
            <DialogDescription>
              {t('page.createPlayerDescription')}
            </DialogDescription>
          </DialogHeader>
          <PlayerProfileForm
            onSuccess={() => {
              setShowPlayerForm(false);
              setHasPlayerVariant(true);
              checkPlayerVariant();
            }}
            onCancel={() => setShowPlayerForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Profile Edit Sheet — slides in from right on desktop, fills screen
          on mobile. Replaces the old Dialog modal which felt cramped for the
          ~770-line edit form. */}
      <EditProfileSheet
        open={showEditForm}
        onOpenChange={setShowEditForm}
        title={t('page.editProfileTitle')}
        description={t('page.editProfileDescription')}
      >
        {profile.data && footballData && (
          <ProfileEditForm
            profileData={{
              full_name: profile.data.full_name ?? null,
              bio: profile.data.bio ?? null,
              social_links:
                (profile.data.social_links as Record<string, string>) ?? null,
              height_cm: profile.data.height_cm ?? null,
              weight_kg: profile.data.weight_kg ?? null,
              date_of_birth: profile.data.date_of_birth ?? null,
              location: profile.data.location ?? null,
              nationality: profile.data.nationality ?? null,
            }}
            footballData={footballData}
            onSaved={() => {
              setShowEditForm(false);
              checkPlayerVariant();
            }}
          />
        )}
      </EditProfileSheet>

      {/* Upload Highlight Dialog */}
      <Dialog
        open={showUploadDialog}
        onOpenChange={(open) => {
          setShowUploadDialog(open);
          if (!open) {
            setUploadTitle('');
            setUploadDescription('');
            setUploadedVideoData(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('page.uploadHighlightTitle')}</DialogTitle>
            <DialogDescription>
              {t('page.uploadHighlightDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                {t('page.uploadFieldTitle')}
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder={t('page.uploadTitlePlaceholder')}
                maxLength={100}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-green-400"
                style={{ color: 'var(--timberwolf)' }}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                {t('page.uploadFieldDescription')}
              </label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder={t('page.uploadDescriptionPlaceholder')}
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-green-400 resize-none"
                style={{ color: 'var(--timberwolf)' }}
              />
            </div>
            {user && (
              <VideoUpload
                userId={user.id}
                onVideoUploaded={(data) =>
                  setUploadedVideoData({
                    url: data.url,
                    thumbnail: data.thumbnail,
                    duration: data.duration,
                  })
                }
                maxFiles={1}
              />
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadDialog(false)}
                className="border-neutral-600"
                style={{ color: 'var(--ash-grey)' }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveHighlight}
                disabled={
                  !uploadedVideoData || !uploadTitle.trim() || savingHighlight
                }
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
              >
                {savingHighlight ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ms-2">{t('common.saving')}</span>
                  </>
                ) : (
                  t('page.saveHighlight')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Career Entry Dialog */}
      <Dialog
        open={showCareerDialog}
        onOpenChange={(open) => {
          setShowCareerDialog(open);
          if (!open) setEditingCareerEntry(null);
        }}
      >
        <DialogContent className="max-w-lg sm:max-w-xl">
          <DialogHeader className="pb-2 mb-2 border-b border-neutral-800/50">
            <DialogTitle className="text-[var(--timberwolf)]">
              {editingCareerEntry
                ? t('page.careerDialogTitleEdit')
                : t('page.careerDialogTitleAdd')}
            </DialogTitle>
            <DialogDescription className="text-[var(--ash-grey)]">
              {t('page.careerDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <CareerEntryForm
            initial={editingCareerEntry}
            onSave={async (input) => {
              let result;
              if (editingCareerEntry) {
                result = await updateCareerEntry(editingCareerEntry.id, input);
              } else {
                result = await addCareerEntry(input);
              }
              if (result.success) {
                setShowCareerDialog(false);
                setEditingCareerEntry(null);
                checkPlayerVariant();
              }
              return result;
            }}
            onCancel={() => {
              setShowCareerDialog(false);
              setEditingCareerEntry(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Education Entry Dialog */}
      <Dialog
        open={showEducationDialog}
        onOpenChange={(open) => {
          setShowEducationDialog(open);
          if (!open) setEditingEducationEntry(null);
        }}
      >
        <DialogContent className="max-w-lg sm:max-w-xl">
          <DialogHeader className="pb-2 mb-2 border-b border-neutral-800/50">
            <DialogTitle className="text-[var(--timberwolf)]">
              {editingEducationEntry
                ? t('page.educationDialogTitleEdit')
                : t('page.educationDialogTitleAdd')}
            </DialogTitle>
            <DialogDescription className="text-[var(--ash-grey)]">
              {t('page.educationDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <EducationEntryForm
            initial={editingEducationEntry}
            onSave={async (input) => {
              let result;
              if (editingEducationEntry) {
                result = await updateEducationEntry(
                  editingEducationEntry.id,
                  input
                );
              } else {
                result = await addEducationEntry(input);
              }
              if (result.success) {
                setShowEducationDialog(false);
                setEditingEducationEntry(null);
                checkPlayerVariant();
              }
              return result;
            }}
            onCancel={() => {
              setShowEducationDialog(false);
              setEditingEducationEntry(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Highlight Video Player Dialog */}
      {activeHighlight && (
        <HighlightVideoDialog
          highlightId={activeHighlight.id}
          videoUrl={activeHighlight.video_url}
          thumbnail={activeHighlight.thumbnail_url}
          title={activeHighlight.title}
          metadata={activeHighlight.metadata}
          open={!!activeHighlight}
          onOpenChange={(open) => {
            if (!open) setActiveHighlight(null);
          }}
        />
      )}

      {/* PLAYHUB Recording Picker Dialog */}
      <Dialog open={showPlayhubPicker} onOpenChange={setShowPlayhubPicker}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('page.importPlayhubTitle')}</DialogTitle>
            <DialogDescription>
              {t('page.importPlayhubDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {loadingRecordings ? (
              <div className="flex justify-center py-8">
                <LumaSpin />
              </div>
            ) : playhubRecordings.length === 0 ? (
              <div className="text-center py-8">
                <Film
                  className="h-8 w-8 mx-auto mb-3"
                  style={{ color: 'var(--ash-grey)' }}
                />
                <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                  {t('page.noRecordings')}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  {t('page.noRecordingsHint')}
                </p>
              </div>
            ) : (
              playhubRecordings.map((rec) => {
                const alreadyImported = highlights.some(
                  (h) =>
                    h.metadata?.source === 'playhub' &&
                    h.metadata?.recording_id === rec.id
                );
                return (
                  <div
                    key={rec.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      alreadyImported
                        ? 'border-neutral-700/30 opacity-50'
                        : 'border-neutral-700/50 hover:border-blue-400/30'
                    }`}
                  >
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                      {rec.thumbnail_url ? (
                        <img
                          src={rec.thumbnail_url}
                          alt={rec.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-5 w-5 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {rec.title ||
                          t('page.teamsVs', {
                            homeTeam: rec.home_team,
                            awayTeam: rec.away_team,
                          })}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        {(() => {
                          const d = rec.match_date
                            ? new Date(rec.match_date)
                            : null;
                          const hasDate = !!d && !Number.isNaN(d.getTime());
                          return hasDate
                            ? t('page.teamsVsWithDate', {
                                homeTeam: rec.home_team,
                                awayTeam: rec.away_team,
                                date: format.dateTime(d!, 'short'),
                              })
                            : t('page.teamsVs', {
                                homeTeam: rec.home_team,
                                awayTeam: rec.away_team,
                              });
                        })()}
                      </p>
                    </div>
                    {alreadyImported ? (
                      <span className="text-xs text-green-400 flex items-center gap-1 flex-shrink-0">
                        <CheckCircle className="h-3 w-3" />
                        {t('page.added')}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-400/50 text-blue-400 hover:bg-blue-400/10 flex-shrink-0"
                        onClick={() => handleImportRecording(rec.id)}
                        disabled={importingId === rec.id}
                      >
                        {importingId === rec.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
