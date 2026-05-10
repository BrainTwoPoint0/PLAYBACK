'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@braintwopoint0/playback-commons/ui';
import { AvatarDisplay } from '@/components/avatar/avatar-upload';
import { ShareModal } from '@/components/profile/share-modal';
import {
  ShieldCheck,
  Eye,
  Share2,
  Pencil,
  MoreHorizontal,
  Settings,
  LogOut,
} from 'lucide-react';

export interface TopBarVariant {
  variantId: string;
  moduleSlug: string;
  label: string;
  visibility: 'public' | 'authenticated' | 'club_only' | 'private';
}

export interface TopBarVerification {
  id: string;
  organizationName: string;
}

interface DashboardTopBarProps {
  username: string;
  fullName: string | null;
  firstName: string;
  avatarUrl: string | null;
  verifications: TopBarVerification[];
  publicVariants: TopBarVariant[];
  onEditProfile: () => void;
  onSignOut: () => void;
}

/**
 * Slim identity-and-actions bar at the top of the dashboard. Replaces the
 * v6 right-side sidebar — Veo/Hudl don't sidebar their player views.
 *
 * Action hierarchy: Edit profile is the daily action (primary filled), Share
 * is secondary (outline), View public is tertiary (ghost icon-button only on
 * desktop), kebab carries Settings + Sign out.
 *
 * On mobile the welcome line stacks above the action row to keep tap targets
 * comfortable.
 */
export function DashboardTopBar({
  username,
  fullName,
  firstName,
  avatarUrl,
  verifications,
  publicVariants,
  onEditProfile,
  onSignOut,
}: DashboardTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const verificationLabel =
    verifications.length === 0
      ? null
      : verifications.length <= 2
        ? `Verified by ${verifications.map((v) => v.organizationName).join(' + ')}`
        : `Verified by ${verifications.length} clubs`;

  return (
    <header className="px-1">
      {/* No card shell — top bar is the page masthead, not a section. The
          first DashboardSection eyebrow ("Match clips") starts the section
          rhythm; the bar floats above it on the page background. */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {/* Identity */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="shrink-0">
            <AvatarDisplay
              avatarUrl={avatarUrl}
              fullName={fullName ?? username}
              size="md"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="text-lg sm:text-2xl font-bold tracking-tight truncate"
              style={{ color: 'var(--timberwolf)' }}
            >
              Welcome back, {firstName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1">
              <span
                className="text-xs sm:text-sm truncate"
                style={{ color: 'var(--text-muted)' }}
              >
                @{username}
              </span>
              {verificationLabel && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border"
                  // Browser title attributes don't render \n consistently.
                  // Use comma-separated list — readable in tooltips, screen
                  // readers, and copy-paste.
                  title={verifications
                    .map((v) => v.organizationName)
                    .join(', ')}
                  style={{
                    borderColor: 'var(--line-strong)',
                    backgroundColor: 'rgba(214,213,201,0.04)',
                    color: 'var(--timberwolf)',
                  }}
                >
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  {verificationLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions. Phase 7 reframe: dashboard is consumption + sharing, not
            editing. Share is the daily action — promote to primary filled
            when there's at least one public module to share. Edit moves into
            the kebab; the canonical edit affordance is the per-module pencil
            in the Modules section. When the user has zero public modules
            (or no modules at all), Share has nothing meaningful to do — drop
            it back to outline and keep Edit as the visible primary so a
            brand-new account still has a day-1 CTA. */}
        <div className="flex items-center gap-2 shrink-0">
          {username && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex hover:bg-[var(--surface-2)]"
              title="View public profile"
            >
              <Link
                href={`/p/${username}`}
                target="_blank"
                rel="noopener"
                aria-label="View public profile"
              >
                <Eye className="h-4 w-4 sm:mr-1.5" aria-hidden />
                <span className="hidden lg:inline">View public</span>
              </Link>
            </Button>
          )}
          {publicVariants.length > 0 ? (
            <ShareModal
              username={username}
              modules={publicVariants.map((v) => ({
                variantId: v.variantId,
                moduleSlug: v.moduleSlug,
                label: v.label,
              }))}
              trigger={
                <Button
                  size="sm"
                  className="bg-[var(--timberwolf)] hover:bg-[var(--timberwolf)]/90 text-[var(--night)]"
                  title="Share profile"
                  aria-label="Share profile"
                >
                  <Share2 className="h-4 w-4 sm:mr-1.5" aria-hidden />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              }
            />
          ) : (
            <Button
              size="sm"
              onClick={onEditProfile}
              className="bg-[var(--timberwolf)] hover:bg-[var(--timberwolf)]/90 text-[var(--night)]"
              title="Edit profile"
              aria-label="Edit profile"
            >
              <Pencil className="h-4 w-4 sm:mr-1.5" aria-hidden />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-[var(--surface-2)]"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-56 p-1"
              style={{
                backgroundColor: 'var(--surface-1)',
                borderColor: 'var(--line-strong)',
              }}
            >
              {username && (
                <Link
                  href={`/p/${username}`}
                  target="_blank"
                  rel="noopener"
                  onClick={() => setMenuOpen(false)}
                  className="sm:hidden flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--surface-2)]"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  <Eye className="h-4 w-4" />
                  View public profile
                </Link>
              )}
              {/* Edit profile lives in the kebab when Share is the visible
                  primary (i.e. user has at least one public module). The
                  canonical edit affordance is per-module in the Modules
                  section; this is the catch-all. */}
              {publicVariants.length > 0 && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEditProfile();
                  }}
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--surface-2)] text-left"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit profile
                </button>
              )}
              <Link
                href="/dashboard/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--timberwolf)' }}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--surface-2)] text-left"
                style={{ color: 'var(--text-muted)' }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
