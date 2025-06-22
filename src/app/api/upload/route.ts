import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Upload configurations
const UPLOAD_CONFIGS = {
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    bucket: 'playback-avatars',
  },
  thumbnail: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    bucket: 'playback-media',
  },
  highlight: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    bucket: 'playback-highlights',
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    bucket: 'playback-media',
  },
};

export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const userId = formData.get('userId') as string;

    // Validate required fields
    if (!file || !type || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, type, or userId' },
        { status: 400 }
      );
    }

    // Validate upload type
    if (!UPLOAD_CONFIGS[type as keyof typeof UPLOAD_CONFIGS]) {
      return NextResponse.json(
        {
          error: `Invalid upload type. Allowed types: ${Object.keys(UPLOAD_CONFIGS).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Get upload configuration
    const config = UPLOAD_CONFIGS[type as keyof typeof UPLOAD_CONFIGS];

    // Validate file size
    if (file.size > config.maxSize) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum allowed size of ${formatFileSize(config.maxSize)}`,
          maxSize: config.maxSize,
          fileSize: file.size,
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `File type ${file.type} is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`,
          allowedTypes: config.allowedTypes,
          fileType: file.type,
        },
        { status: 400 }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filePath = `${userId}/${type}/${timestamp}-${randomId}.${extension}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(config.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(config.bucket)
      .getPublicUrl(filePath);

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: filePath,
        size: file.size,
        type: file.type,
        bucket: config.bucket,
      },
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);

    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    const bucket = searchParams.get('bucket') || 'playback-media';

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Delete file from storage
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);

    return NextResponse.json(
      {
        error: 'Delete failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Utility function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
