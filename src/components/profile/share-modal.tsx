'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@braintwopoint0/playback-commons/ui';
import { Share2, Copy, Check, Globe, User2, ExternalLink } from 'lucide-react';

interface ShareableModule {
  variantId: string;
  moduleSlug: string;
  label: string;
}

interface ShareModalProps {
  username: string;
  modules: ShareableModule[];
  /**
   * Override the trigger UI (defaults to a small outline button).
   */
  trigger?: React.ReactNode;
}

type Scope = { kind: 'profile' } | { kind: 'module'; moduleSlug: string };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';

function urlForScope(username: string, scope: Scope): string {
  const base = APP_URL || 'https://playbacksports.ai';
  // Encode segments so a username/moduleSlug with surprising characters never
  // produces a malformed URL on copy or native share. Validation upstream
  // already restricts these, but this is the canonical safe build.
  const encUsername = encodeURIComponent(username);
  if (scope.kind === 'profile') {
    return `${base}/p/${encUsername}`;
  }
  return `${base}/p/${encUsername}/${encodeURIComponent(scope.moduleSlug)}`;
}

/**
 * Share modal — two-step flow: pick scope, then copy or open. URLs are
 * deterministic (no expiring tokens in v1); the scope picker exists so a
 * parent never accidentally shares a multi-module profile when they only
 * meant to send one clip's parent module.
 */
export function ShareModal({ username, modules, trigger }: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const [scopeKey, setScopeKey] = useState<string>('profile');
  const [copied, setCopied] = useState(false);

  const scope: Scope =
    scopeKey === 'profile'
      ? { kind: 'profile' }
      : { kind: 'module', moduleSlug: scopeKey };
  const url = urlForScope(username, scope);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Older browsers / non-secure context — selectively fall back.
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        // execCommand returns false on failure; without checking we'd flash a
        // bogus "copied" tick when nothing reached the clipboard.
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
      navigator.share({ url, title: `${username} on PLAYBACK` }).catch(() => {
        // User cancelled or permission denied — silently no-op.
      });
    }
  }

  const canNativeShare =
    typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share profile</DialogTitle>
          <DialogDescription>
            Pick what to share. The link is public — anyone with it can view.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={scopeKey}
          onValueChange={setScopeKey}
          className="space-y-2"
        >
          <label
            htmlFor="scope-profile"
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-foreground/30 transition-colors cursor-pointer"
          >
            <RadioGroupItem
              id="scope-profile"
              value="profile"
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User2 className="h-3.5 w-3.5" />
                Full profile
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                All public modules — the recipient sees everything you&apos;ve
                made public.
              </p>
            </div>
          </label>

          {modules.length === 0 && (
            <p className="text-xs text-muted-foreground italic px-1">
              No public modules yet — turn one on to share a single module.
            </p>
          )}

          {modules.map((m) => (
            <label
              key={m.variantId}
              htmlFor={`scope-${m.variantId}`}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-foreground/30 transition-colors cursor-pointer"
            >
              <RadioGroupItem
                id={`scope-${m.variantId}`}
                value={m.moduleSlug}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-3.5 w-3.5" />
                  {m.label} module
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Just your {m.label.toLowerCase()} surface — nothing else
                  visible at this URL.
                </p>
              </div>
            </label>
          ))}
        </RadioGroup>

        <div className="space-y-2 pt-2">
          <div
            className="text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--ash-grey)' }}
          >
            Generated link
          </div>
          <div className="flex items-center gap-2">
            <code
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
              aria-label="Copy link"
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
                aria-label="Share via system share sheet"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { ShareableModule };
