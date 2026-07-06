import { Link } from '@/i18n/navigation';
import {
  Play,
  Trophy,
  Shield,
  Sparkles,
  Wrench,
  Dumbbell,
  Film,
} from 'lucide-react';
import type { PublicProfile } from '@/lib/profile/get-public-profile';

// Plain <img> rather than next/image: thumbnails come from a mix of Supabase
// Storage, Veo, and Spiideo CDNs that aren't all in next.config images
// allowlist, and routing them through /_next/image would also expose an
// SSRF/cache-pollution surface to anyone able to write thumbnail_url.

interface AttributedClipsProps {
  clips: PublicProfile['attributedClips'];
  // PLAYHUB host the recording lives on; drives the "watch" deep link. Falls
  // back to the marketing site if not configured.
  playhubBaseUrl?: string;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  goal: { label: 'Goal', Icon: Trophy },
  assist: { label: 'Assist', Icon: Sparkles },
  save: { label: 'Save', Icon: Shield },
  tackle: { label: 'Tackle', Icon: Wrench },
  skill: { label: 'Skill', Icon: Dumbbell },
  custom: { label: 'Clip', Icon: Film },
};

function formatMatchDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AttributedClips({
  clips,
  playhubBaseUrl,
}: AttributedClipsProps) {
  if (clips.length === 0) return null;

  const playhub = playhubBaseUrl ?? 'https://playhub.playbacksports.ai';

  return (
    <section aria-labelledby="attributed-clips-heading">
      <div className="flex items-baseline justify-between mb-4">
        <h2
          id="attributed-clips-heading"
          className="text-lg font-semibold tracking-tight"
          style={{ color: 'var(--timberwolf)' }}
        >
          Match clips
        </h2>
        <span className="text-xs" style={{ color: 'var(--ash-grey)' }}>
          Tagged by clubs
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {clips.map((clip) => {
          const cfg = TYPE_CONFIG[clip.type] ?? TYPE_CONFIG.custom;
          const Icon = cfg.Icon;
          // PLAYHUB /watch/[id] takes ?from for analytics; in-clip seek
          // (?start=N) is a v1.1 deep-link feature once the player supports
          // it. For now the link lands on the parent recording.
          const watchUrl = `${playhub}/watch/${clip.recordingId}?from=profile`;
          const duration = clip.offsetEndMs - clip.offsetStartMs;
          return (
            <Link
              key={clip.attributionId}
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl overflow-hidden border transition-[box-shadow,border-color] motion-reduce:transition-none hover:border-[var(--line-strong)]"
              style={{
                backgroundColor: 'var(--surface-1)',
                borderColor: 'var(--line)',
              }}
            >
              <div
                className="relative aspect-video overflow-hidden"
                style={{ backgroundColor: 'var(--surface-2)' }}
              >
                {clip.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={clip.thumbnailUrl}
                    alt={clip.title ?? clip.recordingTitle}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film
                      className="h-6 w-6 opacity-40"
                      style={{ color: 'var(--ash-grey)' }}
                    />
                  </div>
                )}

                {/* Top + bottom gradient lets the type pill and duration sit
                    legibly on bright pitch thumbnails. */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[rgba(10,16,13,0.6)] to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[rgba(10,16,13,0.85)] to-transparent pointer-events-none" />

                <div
                  className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md"
                  style={{
                    backgroundColor: 'rgba(10,16,13,0.55)',
                    color: 'var(--timberwolf)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                >
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </div>

                {duration > 0 && (
                  <div
                    className="absolute top-2 right-2 text-[11px] font-mono tabular-nums"
                    style={{ color: 'rgba(214,213,201,0.85)' }}
                  >
                    {formatDuration(duration)}
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out motion-reduce:transition-none">
                  <div
                    className="rounded-full p-3"
                    style={{
                      backgroundColor: 'rgba(214,213,201,0.95)',
                      color: 'var(--night)',
                    }}
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </div>
                </div>
              </div>

              <div className="px-4 py-3.5 space-y-1">
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  {clip.title ?? `${clip.homeTeam} vs ${clip.awayTeam}`}
                </div>
                <div
                  className="text-xs truncate tabular-nums"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  {formatMatchDate(clip.matchDate)}
                  {clip.jerseyNumberAtMatch !== null
                    ? ` · #${clip.jerseyNumberAtMatch}`
                    : ''}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
