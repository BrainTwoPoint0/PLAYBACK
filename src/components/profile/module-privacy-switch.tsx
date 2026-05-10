'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Globe,
  Lock,
  Users,
  Building2,
  AlertCircle,
  Check,
} from 'lucide-react';

type Visibility = 'public' | 'authenticated' | 'club_only' | 'private';

interface ModulePrivacySwitchProps {
  variantId: string;
  initialVisibility: Visibility;
  variantLabel?: string;
  /**
   * Notified after a successful save so the parent can keep dependent UI
   * (share modal scope availability, etc.) in sync without re-fetching.
   */
  onChange?: (visibility: Visibility) => void;
}

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  // `club_only` lives in the schema + API but the org-picker UI hasn't
  // shipped — selecting it without a picker would silently persist `[]` and
  // deny everyone, which reads as "broken". Disabled here until the picker
  // lands. Existing variants already on `club_only` still render correctly
  // (handled below in the trigger), and the API still accepts the value
  // when the picker eventually sends it explicitly.
  disabled?: boolean;
}[] = [
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can view this module',
    Icon: Globe,
  },
  {
    value: 'authenticated',
    label: 'Signed-in only',
    description: 'Anyone with a PLAYBACK account',
    Icon: Users,
  },
  {
    value: 'club_only',
    label: 'Club only',
    description: 'Coming soon — pick which clubs can see this module',
    Icon: Building2,
    disabled: true,
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only you',
    Icon: Lock,
  },
];

/**
 * Per-module privacy switch. Optimistic local update with rollback on error;
 * synchronous useRef guard against double-fire while useTransition's `pending`
 * flag lags by a tick.
 */
export function ModulePrivacySwitch({
  variantId,
  initialVisibility,
  variantLabel,
  onChange,
}: ModulePrivacySwitchProps) {
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const inFlightRef = useRef(false);

  // Auto-clear the "Saved" microcopy 1.5s after a successful save so it
  // doesn't linger on screen between unrelated edits.
  useEffect(() => {
    if (savedAt === null) return;
    const t = setTimeout(() => setSavedAt(null), 1500);
    return () => clearTimeout(t);
  }, [savedAt]);

  function update(next: Visibility) {
    if (next === visibility) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const prev = visibility;
    setVisibility(next);
    setError(null);
    setSavedAt(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/profile/modules/${variantId}/privacy`, {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visibility: next }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error ?? `Request failed: ${res.status}`);
        }
        onChange?.(next);
        setSavedAt(Date.now());
      } catch (err) {
        setVisibility(prev);
        setError(err instanceof Error ? err.message : 'Failed');
      } finally {
        inFlightRef.current = false;
      }
    });
  }

  const current = VISIBILITY_OPTIONS.find((o) => o.value === visibility)!;
  const Icon = current.Icon;
  // If a variant is already on a disabled-by-UI value (e.g. legacy `club_only`),
  // we still need to show it as the current selection — the API/data is the
  // source of truth, the disabled flag only blocks new selections.

  return (
    <div className="space-y-2">
      <Select value={visibility} onValueChange={update} disabled={pending}>
        <SelectTrigger
          aria-label={
            variantLabel
              ? `${variantLabel} module visibility`
              : 'Module visibility'
          }
          className="w-full"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <SelectValue>
              <span className="truncate">{current.label}</span>
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {VISIBILITY_OPTIONS.map((opt) => {
            const OptIcon = opt.Icon;
            // Allow the currently-active value to render even when the option
            // is otherwise disabled — Radix Select would otherwise show an
            // empty trigger label for a value not present in the list.
            const isCurrent = opt.value === visibility;
            const disabled = opt.disabled && !isCurrent;
            return (
              <SelectItem key={opt.value} value={opt.value} disabled={disabled}>
                <div className="flex items-start gap-2 py-0.5">
                  <OptIcon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {opt.description}
                    </div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {/* aria-live polite region — assistive tech reads success/failure
          without stealing focus. The visible state is also styled to match
          the message intent. */}
      <div role="status" aria-live="polite" className="min-h-[1rem]">
        {error && (
          <div className="flex items-start gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {savedAt !== null && !error && (
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--ash-grey)' }}
          >
            <Check className="h-3 w-3 shrink-0" aria-hidden />
            <span>Saved</span>
          </div>
        )}
      </div>
    </div>
  );
}
