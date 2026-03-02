import { Play } from 'lucide-react';

interface Highlight {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
  duration: number | null;
  view_count: number | null;
  metadata: Record<string, unknown> | null;
}

interface ProfileHighlightsProps {
  highlights: Highlight[];
}

export function ProfileHighlights({ highlights }: ProfileHighlightsProps) {
  return (
    <div className="space-y-4">
      <h2
        className="text-lg font-semibold"
        style={{ color: 'var(--timberwolf)' }}
      >
        Highlights
      </h2>

      {highlights.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-neutral-800/20 border border-neutral-700/30">
          <Play
            className="h-8 w-8 mx-auto mb-3"
            style={{ color: 'var(--ash-grey)' }}
          />
          <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
            No highlights yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {highlights.map((highlight) => (
            <a
              key={highlight.id}
              href={highlight.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl overflow-hidden bg-neutral-800/30 border border-neutral-700/30 hover:border-neutral-600 transition-all"
            >
              <div className="relative aspect-video bg-neutral-900">
                {highlight.thumbnail_url ? (
                  <img
                    src={highlight.thumbnail_url}
                    alt={highlight.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-8 w-8 text-neutral-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>
                {highlight.metadata?.source === 'playhub' && (
                  <span className="absolute top-2 left-2 bg-blue-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    PLAYHUB
                  </span>
                )}
                {highlight.duration && (
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {formatDuration(highlight.duration)}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  {highlight.title}
                </p>
                {highlight.view_count != null && highlight.view_count > 0 && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    {highlight.view_count} views
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
