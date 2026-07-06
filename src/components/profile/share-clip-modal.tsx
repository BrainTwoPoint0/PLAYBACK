'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@braintwopoint0/playback-commons/ui';
import {
  Copy,
  Check,
  Share2,
  Trophy,
  Shield,
  Sparkles,
  Wrench,
  Dumbbell,
  Film,
} from 'lucide-react';

type ClipType = 'goal' | 'assist' | 'save' | 'tackle' | 'skill' | 'custom';

// Display labels live under `profileLabels.clipTypes.*`.
const TYPE_ICON: Record<
  ClipType,
  React.ComponentType<{ className?: string }>
> = {
  goal: Trophy,
  assist: Sparkles,
  save: Shield,
  tackle: Wrench,
  skill: Dumbbell,
  custom: Film,
};

interface ShareClipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingId: string;
  attributionId: string;
  clipType: ClipType;
  clipTitle: string | null;
  homeTeam: string;
  awayTeam: string;
  /** Override the PLAYHUB host. Falls back to env / prod. */
  playhubBaseUrl?: string;
}

/**
 * Single-clip share dialog. URL targets the PLAYHUB watch page with a
 * forward-looking `?clip=<attributionId>` parameter — PLAYHUB ignores it
 * today, but the link survives the eventual deep-link wire-up so anything
 * shared now still resolves to the right moment later.
 */
export function ShareClipModal({
  open,
  onOpenChange,
  recordingId,
  attributionId,
  clipType,
  clipTitle,
  homeTeam,
  awayTeam,
  playhubBaseUrl,
}: ShareClipModalProps) {
  const t = useTranslations('profile.shareClip');
  const tShare = useTranslations('profile.share');
  const tClipTypes = useTranslations('profileLabels.clipTypes');
  const [copied, setCopied] = useState(false);

  const playhub =
    playhubBaseUrl ??
    process.env.NEXT_PUBLIC_PLAYHUB_URL?.replace(/\/$/, '') ??
    'https://playhub.playbacksports.ai';

  const url = `${playhub}/watch/${encodeURIComponent(
    recordingId
  )}?clip=${encodeURIComponent(attributionId)}&from=dashboard-share`;

  const Icon = TYPE_ICON[clipType] ?? Film;
  const typeKey = clipType in TYPE_ICON ? clipType : 'custom';
  const typeLabel = tClipTypes(typeKey);
  const matchLabel = t('matchup', { home: homeTeam, away: awayTeam });
  const shareTitle = clipTitle
    ? t('shareTitleWithClip', { type: typeLabel, clipTitle, match: matchLabel })
    : t('shareTitleFromMatch', { type: typeLabel, match: matchLabel });

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        const ok = document.execCommand('copy');
        if (ok) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  function nativeShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      navigator
        .share({ url, title: shareTitle, text: shareTitle })
        .catch((err: unknown) => {
          // AbortError = user dismissed the sheet — that's not a failure.
          // Anything else (permissions-policy denial, expired user activation
          // on iOS Safari, etc.) means the share didn't go through; fall
          // through to copy so the user still walks away with the link.
          if (
            err &&
            typeof err === 'object' &&
            'name' in err &&
            (err as { name: string }).name === 'AbortError'
          ) {
            return;
          }
          copy();
        });
    }
  }

  const canNativeShare =
    typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4" aria-hidden />
            {t('title', { type: typeLabel.toLowerCase() })}
          </DialogTitle>
          <DialogDescription>
            {clipTitle
              ? t('descriptionWithTitle', { clipTitle, match: matchLabel })
              : t('description', { match: matchLabel })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          <div
            className="text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--ash-grey)' }}
          >
            {tShare('generatedLink')}
          </div>
          <div className="flex items-center gap-2">
            {/* URLs are LTR — pin direction so they render correctly in RTL. */}
            <code
              dir="ltr"
              className="flex-1 min-w-0 truncate text-xs px-3 py-2 rounded-md font-mono border"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--line)',
                color: 'var(--timberwolf)',
              }}
            >
              {url}
            </code>
            <Button
              size="sm"
              variant={copied ? 'default' : 'outline'}
              onClick={copy}
              aria-label={tShare('copyLink')}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            {canNativeShare && (
              <Button
                size="sm"
                variant="outline"
                onClick={nativeShare}
                aria-label={tShare('shareSheet')}
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
