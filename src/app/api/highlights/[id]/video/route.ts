import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getS3Client() {
  if (
    !process.env.PLAYHUB_AWS_ACCESS_KEY_ID ||
    !process.env.PLAYHUB_AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error('AWS credentials not configured');
  }
  return new S3Client({
    region: process.env.PLAYHUB_AWS_REGION || 'eu-west-2',
    credentials: {
      accessKeyId: process.env.PLAYHUB_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.PLAYHUB_AWS_SECRET_ACCESS_KEY,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the highlight with ownership info
  const { data: highlight, error } = await supabase
    .from('highlights')
    .select('id, video_url, metadata, is_public, profile_id')
    .eq('id', id)
    .single();

  if (error || !highlight) {
    return NextResponse.json({ error: 'Highlight not found' }, { status: 404 });
  }

  // Authorization: must be public or owned by the requesting user
  const hlAny = highlight as any;
  if (!hlAny.is_public) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Verify ownership via profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (!profile || (profile as any).id !== hlAny.profile_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const meta = hlAny.metadata as Record<string, unknown> | null;

  // If it's a PLAYHUB S3-hosted recording, generate signed URL directly
  if (
    meta?.source === 'playhub' &&
    meta?.recording_id &&
    meta?.content_type === 'hosted_video'
  ) {
    // Look up the recording's S3 key from the DB
    const { data: recording } = await supabase
      .from('playhub_match_recordings')
      .select('s3_key, s3_bucket')
      .eq('id', meta.recording_id as string)
      .single();

    if (!recording || !(recording as any).s3_key) {
      return NextResponse.json(
        { error: 'Recording video not found' },
        { status: 404 }
      );
    }

    try {
      const command = new GetObjectCommand({
        Bucket: (recording as any).s3_bucket,
        Key: (recording as any).s3_key,
      });
      const url = await getSignedUrl(getS3Client(), command, {
        expiresIn: 3600,
      });
      return NextResponse.json({ url, type: 'mp4' });
    } catch {
      return NextResponse.json(
        { error: 'Failed to generate video URL' },
        { status: 500 }
      );
    }
  }

  // For direct video URLs (uploads or external providers)
  const videoUrl = (highlight as any).video_url as string;
  if (!videoUrl) {
    return NextResponse.json({ error: 'No video URL' }, { status: 404 });
  }

  // Determine type from URL
  const isYouTube =
    videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const type = isYouTube ? 'youtube' : 'external';

  return NextResponse.json({ url: videoUrl, type });
}
