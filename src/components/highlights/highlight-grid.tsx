'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/video/video-player';
import { type Highlight } from '@/lib/highlights/utils';
import { formatDuration } from '@/lib/video/utils';
import {
  Play,
  Eye,
  Star,
  Calendar,
  Tag,
  Share2,
  MoreVertical,
  Edit3,
  Trash2,
} from 'lucide-react';

interface HighlightGridProps {
  highlights: Highlight[];
  showActions?: boolean;
  columns?: 1 | 2 | 3 | 4;
  onEdit?: (highlight: Highlight) => void;
  onDelete?: (highlight: Highlight) => void;
  onShare?: (highlight: Highlight) => void;
}

export function HighlightGrid({
  highlights,
  showActions = false,
  columns = 3,
  onEdit,
  onDelete,
  onShare,
}: HighlightGridProps) {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (highlights.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-neutral-800/30 rounded-2xl inline-block mb-4">
          <Play className="h-12 w-12" style={{ color: 'var(--ash-grey)' }} />
        </div>
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--timberwolf)' }}
        >
          No highlights yet
        </h3>
        <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
          Upload your first highlight video to get started
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {highlights.map((highlight) => (
        <HighlightCard
          key={highlight.id}
          highlight={highlight}
          isPlaying={playingVideo === highlight.id}
          onPlay={() => setPlayingVideo(highlight.id)}
          onPause={() => setPlayingVideo(null)}
          showActions={showActions}
          onEdit={onEdit}
          onDelete={onDelete}
          onShare={onShare}
        />
      ))}
    </div>
  );
}

interface HighlightCardProps {
  highlight: Highlight;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  showActions?: boolean;
  onEdit?: (highlight: Highlight) => void;
  onDelete?: (highlight: Highlight) => void;
  onShare?: (highlight: Highlight) => void;
}

function HighlightCard({
  highlight,
  isPlaying,
  onPlay,
  onPause,
  showActions = false,
  onEdit,
  onDelete,
  onShare,
}: HighlightCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl overflow-hidden hover:border-neutral-600/50 transition-all duration-300 group">
      {/* Video Player */}
      <div className="aspect-video">
        <VideoPlayer
          src={highlight.video_url}
          thumbnail={highlight.thumbnail_url || undefined}
          title={highlight.title}
          controls={isPlaying}
          onPlay={onPlay}
          onPause={onPause}
          className="w-full h-full"
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold truncate"
              style={{ color: 'var(--timberwolf)' }}
            >
              {highlight.title}
            </h3>
            {highlight.description && (
              <p
                className="text-sm mt-1 line-clamp-2"
                style={{ color: 'var(--ash-grey)' }}
              >
                {highlight.description}
              </p>
            )}
          </div>

          {/* Actions Dropdown */}
          {showActions && (
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1 hover:bg-neutral-700/50"
              >
                <MoreVertical
                  className="h-4 w-4"
                  style={{ color: 'var(--ash-grey)' }}
                />
              </Button>

              {showDropdown && (
                <div className="absolute right-0 top-8 z-10 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg min-w-[120px]">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(highlight);
                        setShowDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-700 flex items-center gap-2"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </button>
                  )}
                  {onShare && (
                    <button
                      onClick={() => {
                        onShare(highlight);
                        setShowDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-700 flex items-center gap-2"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      <Share2 className="h-3 w-3" />
                      Share
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(highlight);
                        setShowDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-red-900/20 text-red-400 flex items-center gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div
          className="flex items-center gap-4 text-xs"
          style={{ color: 'var(--ash-grey)' }}
        >
          <div className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            <span>{formatDuration(highlight.duration || 0)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{highlight.views || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {highlight.created_at
                ? new Date(highlight.created_at).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Tags and Badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Sport Badge */}
            {highlight.sport_id && (
              <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-1 rounded-full">
                Sport
              </span>
            )}

            {/* Public Badge */}
            {highlight.is_public && (
              <span className="text-xs bg-green-400/10 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3" />
                Public
              </span>
            )}
          </div>

          {/* Privacy Indicator */}
          <div className="flex items-center gap-2">
            {highlight.is_public ? (
              <Eye className="h-3 w-3 text-green-400" />
            ) : (
              <Eye className="h-3 w-3 text-neutral-500" />
            )}
          </div>
        </div>

        {/* Skill Tags */}
        {highlight.tags && highlight.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {highlight.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-neutral-700/50 px-2 py-1 rounded-full"
                style={{ color: 'var(--ash-grey)' }}
              >
                {tag}
              </span>
            ))}
            {highlight.tags.length > 3 && (
              <span
                className="text-xs bg-neutral-700/50 px-2 py-1 rounded-full"
                style={{ color: 'var(--ash-grey)' }}
              >
                +{highlight.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
