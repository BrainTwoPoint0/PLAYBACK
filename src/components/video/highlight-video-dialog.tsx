'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { VideoPlayer } from './video-player';
import { ExternalLink } from 'lucide-react';
import { LumaSpin } from '@braintwopoint0/playback-commons/ui';

interface HighlightVideoDialogProps {
  highlightId: string;
  videoUrl: string;
  thumbnail?: string | null;
  title: string;
  metadata?: Record<string, unknown> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HighlightVideoDialog({
  highlightId,
  videoUrl,
  thumbnail,
  title,
  metadata,
  open,
  onOpenChange,
}: HighlightVideoDialogProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolvedType, setResolvedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveVideo = useCallback(async () => {
    // If it's a PLAYHUB S3 recording with no direct URL, resolve via API
    const isPlayhubS3 =
      metadata?.source === 'playhub' &&
      metadata?.content_type === 'hosted_video';

    if (isPlayhubS3 || !videoUrl) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/highlights/${highlightId}/video`);
        if (!res.ok) {
          setError('Could not load video');
          return;
        }
        const data = await res.json();
        setResolvedUrl(data.url);
        setResolvedType(data.type);
      } catch {
        setError('Failed to load video');
      } finally {
        setLoading(false);
      }
    } else {
      // Direct URL - determine type
      const isYouTube =
        videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
      const isVeo = videoUrl.includes('veo.co');
      if (isYouTube) {
        setResolvedUrl(videoUrl);
        setResolvedType('youtube');
      } else if (isVeo) {
        setResolvedUrl(videoUrl);
        setResolvedType('external');
      } else {
        setResolvedUrl(videoUrl);
        setResolvedType('mp4');
      }
    }
  }, [highlightId, videoUrl, metadata]);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      resolveVideo();
    } else {
      setResolvedUrl(null);
      setResolvedType(null);
      setError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-neutral-800">
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>
        <div className="p-3 border-b border-neutral-800">
          <p
            className="text-sm font-medium truncate"
            style={{ color: 'var(--timberwolf)' }}
          >
            {title}
          </p>
        </div>

        <div className="aspect-video bg-black">
          {loading && (
            <div className="w-full h-full flex items-center justify-center">
              <LumaSpin />
            </div>
          )}

          {error && (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && resolvedUrl && resolvedType === 'mp4' && (
            <VideoPlayer
              src={resolvedUrl}
              thumbnail={thumbnail || undefined}
              title={title}
              autoPlay
            />
          )}

          {!loading && !error && resolvedUrl && resolvedType === 'external' && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              {thumbnail && (
                <img
                  src={thumbnail}
                  alt={title}
                  className="max-h-48 rounded-lg opacity-60"
                />
              )}
              <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                This video is hosted externally
              </p>
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                Open Video
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {!loading &&
            !error &&
            resolvedUrl &&
            resolvedType === 'youtube' &&
            (() => {
              const match = resolvedUrl.match(
                /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
              );
              const videoId = match?.[1];
              if (!videoId) return null;
              return (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              );
            })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
