'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { HighlightVideoDialog } from '@/components/video/highlight-video-dialog';

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
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(
    null
  );

  return (
    <div className="space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--ash-grey)' }}
      >
        Highlights
      </h2>

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
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {highlights.map((highlight) => (
            <button
              key={highlight.id}
              onClick={() => setActiveHighlight(highlight)}
              className="group rounded-xl overflow-hidden bg-neutral-900/50 border border-neutral-800/50 hover:border-neutral-600/50 transition-all duration-300 text-left"
            >
              <div className="relative aspect-video bg-neutral-900">
                {highlight.thumbnail_url ? (
                  <img
                    src={highlight.thumbnail_url}
                    alt={highlight.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-8 w-8 text-neutral-700" />
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                </div>
                {highlight.metadata?.source === 'playhub' && (
                  <span className="absolute top-2 left-2 bg-blue-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    PLAYHUB
                  </span>
                )}
                {highlight.duration && (
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded tabular-nums">
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
                    className="text-xs mt-0.5 opacity-60"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    {highlight.view_count.toLocaleString()} views
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Video Player Dialog */}
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
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
