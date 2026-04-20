'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  useAuth,
  useProfile,
  useOnboardingStatus,
} from '@braintwopoint0/playback-commons/auth';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button, LumaSpin } from '@braintwopoint0/playback-commons/ui';
import { LoadingSpinner } from '@/components/ui/loading';
import { AvatarUpload } from '@/components/avatar/avatar-upload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PlayerProfileForm } from '@/components/profile/player-profile-form';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { VideoUpload } from '@/components/video/video-upload';
import { HighlightVideoDialog } from '@/components/video/highlight-video-dialog';
import {
  createHighlight,
  deleteHighlight,
  importRecordingAsHighlight,
  updateCoverImage,
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
  User,
  Trophy,
  LogOut,
  Camera,
  Instagram,
  Twitter,
  Linkedin,
  CheckCircle,
  ExternalLink,
  Edit3,
  Share2,
  ChevronRight,
  Play,
  Plus,
  Trash2,
  Film,
  Crown,
  Briefcase,
  GraduationCap,
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
        className="text-sm font-medium"
        style={{ color: 'var(--timberwolf)' }}
      >
        @{username}
      </span>
      <ExternalLink className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
      setError('Organization name is required');
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
      setError(result.error || 'Failed to save');
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-2">
        <label
          className="text-sm font-medium"
          style={{ color: 'var(--timberwolf)' }}
        >
          Organization *
        </label>
        <input
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          maxLength={255}
          className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
          placeholder="e.g. Chelsea FC Academy"
        />
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-medium"
          style={{ color: 'var(--timberwolf)' }}
        >
          Role
        </label>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          maxLength={100}
          className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
          placeholder="e.g. Midfielder, U18 Captain"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--timberwolf)' }}
          >
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] focus:outline-none focus:ring-1 focus:ring-zinc-300"
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--timberwolf)' }}
          >
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isCurrent}
            className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] focus:outline-none focus:ring-1 focus:ring-zinc-300 disabled:opacity-40"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isCurrent}
          onChange={(e) => setIsCurrent(e.target.checked)}
          className="rounded border-neutral-600"
        />
        <span className="text-sm" style={{ color: 'var(--timberwolf)' }}>
          Currently here
        </span>
      </label>
      <div className="space-y-2">
        <label
          className="text-sm font-medium"
          style={{ color: 'var(--timberwolf)' }}
        >
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={2}
          className="flex w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 resize-none"
          placeholder="Brief description..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          style={{ color: 'var(--ash-grey)' }}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={saving}
          onClick={handleSubmit}
          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
        >
          {saving ? <LoadingSpinner size="sm" /> : 'Save'}
        </Button>
      </div>
    </div>
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
      setError('Institution name is required');
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
      setError(result.error || 'Failed to save');
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-2">
        <label
          className="text-sm font-medium"
          style={{ color: 'var(--timberwolf)' }}
        >
          Institution *
        </label>
        <input
          value={institutionName}
          onChange={(e) => setInstitutionName(e.target.value)}
          maxLength={255}
          className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
          placeholder="e.g. University of Manchester"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--timberwolf)' }}
          >
            Type
          </label>
          <select
            value={institutionType}
            onChange={(e) => setInstitutionType(e.target.value)}
            className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] focus:outline-none focus:ring-1 focus:ring-zinc-300"
          >
            <option value="">Select type</option>
            <option value="school">School</option>
            <option value="college">College</option>
            <option value="university">University</option>
            <option value="academy">Academy</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--timberwolf)' }}
          >
            Degree/Program
          </label>
          <input
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            maxLength={255}
            className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            placeholder="e.g. BSc"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-medium"
          style={{ color: 'var(--timberwolf)' }}
        >
          Field of Study
        </label>
        <input
          value={fieldOfStudy}
          onChange={(e) => setFieldOfStudy(e.target.value)}
          maxLength={255}
          className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
          placeholder="e.g. Sport Science"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--timberwolf)' }}
          >
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] focus:outline-none focus:ring-1 focus:ring-zinc-300"
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--timberwolf)' }}
          >
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isCurrent}
            className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] focus:outline-none focus:ring-1 focus:ring-zinc-300 disabled:opacity-40"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isCurrent}
          onChange={(e) => setIsCurrent(e.target.checked)}
          className="rounded border-neutral-600"
        />
        <span className="text-sm" style={{ color: 'var(--timberwolf)' }}>
          Currently attending
        </span>
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          style={{ color: 'var(--ash-grey)' }}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={saving}
          onClick={handleSubmit}
          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
        >
          {saving ? <LoadingSpinner size="sm" /> : 'Save'}
        </Button>
      </div>
    </div>
  );
}

function DashboardContent() {
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
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
    const { data: variant } = await supabase
      .from('profile_variants')
      .select('id')
      .eq('profile_id', profile.data.id)
      .eq('variant_type', 'player')
      .single();
    setHasPlayerVariant(!!variant);

    if (variant) {
      const typedVariant = variant as unknown as { id: string };
      setPlayerVariantId(typedVariant.id);
      const { data: football } = await supabase
        .from('football_player_profiles')
        .select(
          'experience_level, preferred_foot, primary_position, secondary_positions, preferred_jersey_number'
        )
        .eq('profile_variant_id', typedVariant.id)
        .single();
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
    }
  }, [profile.data?.id]);

  useEffect(() => {
    checkPlayerVariant();
  }, [checkPlayerVariant]);

  // Calculate profile completion
  const profileCompletion = useMemo(() => {
    if (!profile.data) return 0;

    const items = [
      { completed: !!(profile.data.full_name && profile.data.bio), weight: 20 },
      { completed: !!profile.data.avatar_url, weight: 15 },
      { completed: !!profile.data.location, weight: 10 },
      { completed: !!profile.data.username, weight: 10 },
      {
        completed: !!(
          profile.data.social_links &&
          Object.values(profile.data.social_links).some((link) => link)
        ),
        weight: 15,
      },
      { completed: hasPlayerVariant, weight: 15 },
      { completed: !!footballData?.primary_position, weight: 15 },
    ];

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const completedWeight = items
      .filter((item) => item.completed)
      .reduce((sum, item) => sum + item.weight, 0);
    return totalWeight > 0
      ? Math.round((completedWeight / totalWeight) * 100)
      : 0;
  }, [profile.data, hasPlayerVariant, footballData]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) return;

    setUploadingCover(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('Cover upload failed:', uploadError);
        setUploadingCover(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('covers')
        .getPublicUrl(path);

      const result = await updateCoverImage(urlData.publicUrl);
      if (result.success) {
        refreshProfile(true);
      }
    } catch {
      console.error('Cover upload failed');
    }
    setUploadingCover(false);
    // Reset input so same file can be re-selected
    if (coverInputRef.current) coverInputRef.current.value = '';
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
        <FadeIn>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1
                className="text-3xl font-extrabold tracking-tight"
                style={{ color: 'var(--timberwolf)' }}
              >
                Welcome back, {profile.data?.full_name?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--ash-grey)' }}>
                Manage your profile and highlights
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-neutral-800/50 transition-colors"
              style={{ color: 'var(--ash-grey)' }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </FadeIn>

        {/* Profile Card with mini hero */}
        <FadeIn delay={100}>
          <div className="rounded-2xl border border-neutral-800/50 overflow-hidden mb-8">
            {/* Mini banner */}
            <div className="h-24 sm:h-32 relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 group/cover">
              {profile.data?.cover_image_url && (
                <img
                  src={profile.data.cover_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--night)] to-transparent" />
              {/* Cover upload button */}
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm opacity-0 group-hover/cover:opacity-100 transition-opacity hover:bg-black/60"
              >
                {uploadingCover ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>

            <div className="px-6 pb-6 -mt-12 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user && (
                    <AvatarUpload
                      userId={user.id}
                      currentAvatarUrl={profile.data?.avatar_url}
                      fullName={profile.data?.full_name || 'User'}
                      onAvatarUpdate={() => refreshProfile(true)}
                      size="lg"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pb-1">
                  <h2
                    className="text-xl font-bold"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    {profile.data?.full_name || 'Your Name'}
                  </h2>
                  {profile.data?.username && (
                    <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                      @{profile.data.username}
                    </p>
                  )}
                  {profile.data?.bio && (
                    <p
                      className="text-sm mt-1 leading-relaxed line-clamp-2"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      {profile.data.bio}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-neutral-700 hover:bg-neutral-800/50"
                    onClick={() => {
                      if (profile.data?.username) {
                        window.location.href = `/player/${profile.data.username}`;
                      }
                    }}
                    disabled={!hasPlayerVariant}
                  >
                    <Share2
                      className="h-3.5 w-3.5 mr-1.5"
                      style={{ color: 'var(--ash-grey)' }}
                    />
                    <span style={{ color: 'var(--ash-grey)' }}>
                      View Public
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
                    onClick={() => {
                      if (hasPlayerVariant && footballData) {
                        setShowEditForm(true);
                      } else {
                        setShowPlayerForm(true);
                      }
                    }}
                  >
                    <Edit3
                      className="h-3.5 w-3.5 mr-1.5"
                      style={{ color: 'var(--timberwolf)' }}
                    />
                    <span style={{ color: 'var(--timberwolf)' }}>
                      Edit Profile
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Slim stats bar */}
            <div className="px-6 py-3 border-t border-neutral-800/50 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  {profileCompletion}%
                </span>
                <div className="w-24 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-400/70 transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <span className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                  Profile
                </span>
              </div>
              <div
                className="w-px h-4"
                style={{ backgroundColor: 'var(--ash-grey)', opacity: 0.2 }}
              />
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  {highlightsCount}
                </span>
                <span className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                  {highlightsCount === 1 ? 'Highlight' : 'Highlights'}
                </span>
              </div>
              {hasPlayerVariant && (
                <>
                  <div
                    className="w-px h-4"
                    style={{ backgroundColor: 'var(--ash-grey)', opacity: 0.2 }}
                  />
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">
                      Player Profile
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column - Modules + Social */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Modules */}
            <FadeIn delay={200}>
              <div>
                <h3
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Profile Modules
                </h3>
                <div className="space-y-2">
                  {/* Player Profile */}
                  <button
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-neutral-800/50 hover:border-neutral-600/50 transition-all duration-200 text-left group"
                    onClick={() => {
                      if (hasPlayerVariant) {
                        window.location.href = `/player/${profile.data?.username}`;
                      } else {
                        setShowPlayerForm(true);
                      }
                    }}
                  >
                    <Trophy className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium group-hover:text-green-400 transition-colors"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        Player Profile
                      </p>
                    </div>
                    {hasPlayerVariant ? (
                      <span className="text-[11px] text-green-400 font-medium">
                        Active
                      </span>
                    ) : (
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Create
                      </span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-green-400 transition-colors" />
                  </button>

                  {/* Coach Profile */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-800/50 opacity-40">
                    <User
                      className="h-4 w-4 flex-shrink-0"
                      style={{ color: 'var(--ash-grey)' }}
                    />
                    <p
                      className="text-sm flex-1"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Coach Profile
                    </p>
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Soon
                    </span>
                  </div>

                  {/* Club Admin */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-800/50 opacity-40">
                    <Crown
                      className="h-4 w-4 flex-shrink-0"
                      style={{ color: 'var(--ash-grey)' }}
                    />
                    <p
                      className="text-sm flex-1"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Club Admin
                    </p>
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Soon
                    </span>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Social Links */}
            {profile.data?.social_links &&
              Object.values(profile.data.social_links).some((link) => link) && (
                <FadeIn delay={300}>
                  <div>
                    <h3
                      className="text-xs font-semibold uppercase tracking-widest mb-4"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Connect
                    </h3>
                    <div className="space-y-2">
                      {profile.data.social_links.instagram && (
                        <SocialLink
                          platform="instagram"
                          username={profile.data.social_links.instagram}
                        />
                      )}
                      {profile.data.social_links.twitter && (
                        <SocialLink
                          platform="twitter"
                          username={profile.data.social_links.twitter}
                        />
                      )}
                      {profile.data.social_links.linkedin && (
                        <SocialLink
                          platform="linkedin"
                          username={profile.data.social_links.linkedin}
                        />
                      )}
                    </div>
                  </div>
                </FadeIn>
              )}

            {/* Career History */}
            {hasPlayerVariant && (
              <FadeIn delay={350}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Career
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-neutral-700 text-xs h-7"
                      onClick={() => {
                        setEditingCareerEntry(null);
                        setShowCareerDialog(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span style={{ color: 'var(--ash-grey)' }}>Add</span>
                    </Button>
                  </div>
                  {careerEntries.length === 0 ? (
                    <div className="text-center py-8 rounded-xl border border-neutral-800/50">
                      <Briefcase
                        className="h-5 w-5 mx-auto mb-2 opacity-30"
                        style={{ color: 'var(--ash-grey)' }}
                      />
                      <p
                        className="text-xs opacity-50"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        No career entries yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {careerEntries.map((entry: any) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-neutral-800/50 group"
                        >
                          <Briefcase className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: 'var(--timberwolf)' }}
                            >
                              {entry.organization_name}
                            </p>
                            {entry.role && (
                              <p
                                className="text-xs truncate"
                                style={{ color: 'var(--ash-grey)' }}
                              >
                                {entry.role}
                              </p>
                            )}
                          </div>
                          {entry.is_current && (
                            <span className="text-[10px] text-green-400 font-medium flex-shrink-0">
                              Current
                            </span>
                          )}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={() => {
                                setEditingCareerEntry(entry);
                                setShowCareerDialog(true);
                              }}
                              className="p-1 rounded hover:bg-neutral-800"
                            >
                              <Edit3
                                className="h-3.5 w-3.5"
                                style={{ color: 'var(--ash-grey)' }}
                              />
                            </button>
                            <button
                              onClick={async () => {
                                await deleteCareerEntry(entry.id);
                                checkPlayerVariant();
                              }}
                              className="p-1 rounded hover:bg-red-900/30"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeIn>
            )}

            {/* Education */}
            <FadeIn delay={400}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Education
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-700 text-xs h-7"
                    onClick={() => {
                      setEditingEducationEntry(null);
                      setShowEducationDialog(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    <span style={{ color: 'var(--ash-grey)' }}>Add</span>
                  </Button>
                </div>
                {educationEntries.length === 0 ? (
                  <div className="text-center py-8 rounded-xl border border-neutral-800/50">
                    <GraduationCap
                      className="h-5 w-5 mx-auto mb-2 opacity-30"
                      style={{ color: 'var(--ash-grey)' }}
                    />
                    <p
                      className="text-xs opacity-50"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      No education entries yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {educationEntries.map((entry: any) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-neutral-800/50 group"
                      >
                        <GraduationCap className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: 'var(--timberwolf)' }}
                          >
                            {entry.institution_name}
                          </p>
                          {entry.degree_or_program && (
                            <p
                              className="text-xs truncate"
                              style={{ color: 'var(--ash-grey)' }}
                            >
                              {entry.degree_or_program}
                            </p>
                          )}
                        </div>
                        {entry.is_current && (
                          <span className="text-[10px] text-blue-400 font-medium flex-shrink-0">
                            Current
                          </span>
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingEducationEntry(entry);
                              setShowEducationDialog(true);
                            }}
                            className="p-1 rounded hover:bg-neutral-800"
                          >
                            <Edit3
                              className="h-3.5 w-3.5"
                              style={{ color: 'var(--ash-grey)' }}
                            />
                          </button>
                          <button
                            onClick={async () => {
                              await deleteEducationEntry(entry.id);
                              checkPlayerVariant();
                            }}
                            className="p-1 rounded hover:bg-red-900/30"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>
          </div>

          {/* Right column - Highlights */}
          <div className="lg:col-span-3">
            {hasPlayerVariant && (
              <FadeIn delay={200}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Highlights
                      <span className="ml-2 normal-case tracking-normal font-normal">
                        ({highlightsCount})
                      </span>
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-neutral-700 text-xs h-7"
                        onClick={() => setShowPlayhubPicker(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        <span
                          className="hidden sm:inline"
                          style={{ color: 'var(--ash-grey)' }}
                        >
                          PLAYHUB
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs h-7"
                        onClick={() => setShowUploadDialog(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        <span style={{ color: 'var(--timberwolf)' }}>
                          Upload
                        </span>
                      </Button>
                    </div>
                  </div>

                  {highlights.length === 0 ? (
                    <div className="text-center py-16 rounded-xl border border-neutral-800/50">
                      <Play
                        className="h-6 w-6 mx-auto mb-2 opacity-30"
                        style={{ color: 'var(--ash-grey)' }}
                      />
                      <p
                        className="text-sm opacity-50"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        No highlights yet
                      </p>
                      <p
                        className="text-xs mt-1 opacity-30"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Upload videos or import from PLAYHUB
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {highlights.map((h) => (
                        <div
                          key={h.id}
                          className="group rounded-xl overflow-hidden bg-neutral-900/50 border border-neutral-800/50 hover:border-neutral-600/50 transition-all duration-300"
                        >
                          <button
                            onClick={() => setActiveHighlight(h)}
                            className="block w-full text-left"
                          >
                            <div className="relative aspect-video bg-neutral-900">
                              {h.thumbnail_url ? (
                                <img
                                  src={h.thumbnail_url}
                                  alt={h.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play className="h-8 w-8 text-neutral-700" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                                  <Play className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              {h.metadata?.source === 'playhub' && (
                                <span className="absolute top-2 left-2 bg-blue-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  PLAYHUB
                                </span>
                              )}
                            </div>
                          </button>
                          <div className="p-3 flex items-center justify-between">
                            <p
                              className="text-sm font-medium truncate flex-1"
                              style={{ color: 'var(--timberwolf)' }}
                            >
                              {h.title}
                            </p>
                            <button
                              onClick={() => handleDeleteHighlight(h.id)}
                              className="ml-2 p-1 rounded hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </div>

      {/* Player Profile Creation Dialog */}
      <Dialog open={showPlayerForm} onOpenChange={setShowPlayerForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Player Profile</DialogTitle>
            <DialogDescription>
              Set up your football player profile to showcase your skills.
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

      {/* Profile Edit Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile details across different sections.
            </DialogDescription>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

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
            <DialogTitle>Upload Highlight</DialogTitle>
            <DialogDescription>
              Add a video highlight to your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                Title *
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Match Highlights vs FC United"
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
                Description
              </label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Optional description..."
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
                Cancel
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
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  'Save Highlight'
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCareerEntry ? 'Edit Career Entry' : 'Add Career Entry'}
            </DialogTitle>
            <DialogDescription>
              Add your clubs, academies, or team history.
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEducationEntry
                ? 'Edit Education Entry'
                : 'Add Education Entry'}
            </DialogTitle>
            <DialogDescription>
              Add your schools, colleges, or courses.
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
            <DialogTitle>Import from PLAYHUB</DialogTitle>
            <DialogDescription>
              Add match recordings you have access to as profile highlights.
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
                  No recordings available
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Purchase match recordings on PLAYHUB to import them here.
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
                        {rec.title || `${rec.home_team} vs ${rec.away_team}`}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        {rec.home_team} vs {rec.away_team}
                        {rec.match_date &&
                          ` · ${new Date(rec.match_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    {alreadyImported ? (
                      <span className="text-xs text-green-400 flex items-center gap-1 flex-shrink-0">
                        <CheckCircle className="h-3 w-3" />
                        Added
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
