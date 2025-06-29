import { createClient } from './client'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function createStorageBuckets() {
    try {
        // Use service role for bucket creation (requires elevated permissions)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        const supabase = serviceKey
            ? createServiceClient(supabaseUrl, serviceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            })
            : createClient() // Fallback to regular client

        const bucketsToCreate = [
            {
                id: 'playback-media',
                name: 'playback-media',
                public: true,
                fileSizeLimit: 52428800, // 50MB
                allowedMimeTypes: ['image/*', 'video/*', 'audio/*']
            },
            {
                id: 'playback-avatars',
                name: 'playback-avatars',
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            },
            {
                id: 'playback-highlights',
                name: 'playback-highlights',
                public: true,
                fileSizeLimit: 104857600, // 100MB
                allowedMimeTypes: ['video/*']
            }
        ]

        const results = []

        for (const bucket of bucketsToCreate) {
            try {
                // Check if bucket already exists
                const { data: existingBuckets } = await supabase.storage.listBuckets()
                const bucketExists = existingBuckets?.some(b => b.name === bucket.name)

                if (!bucketExists) {
                    const { data, error } = await supabase.storage.createBucket(bucket.id, {
                        public: bucket.public,
                        fileSizeLimit: bucket.fileSizeLimit,
                        allowedMimeTypes: bucket.allowedMimeTypes
                    })

                    if (error) {
                        results.push({
                            bucket: bucket.name,
                            success: false,
                            error: error.message || 'Unknown storage error'
                        })
                    } else {
                        results.push({
                            bucket: bucket.name,
                            success: true,
                            data
                        })
                    }
                } else {
                    results.push({
                        bucket: bucket.name,
                        success: true,
                        message: 'Bucket already exists'
                    })
                }
            } catch (err) {
                results.push({
                    bucket: bucket.name,
                    success: false,
                    error: (err as Error).message
                })
            }
        }

        const allSuccessful = results.every(r => r.success)

        return {
            success: allSuccessful,
            results,
            message: allSuccessful
                ? 'All storage buckets created successfully!'
                : 'Some storage buckets failed to create. You may need to create them manually in the Supabase Dashboard.',
            suggestion: !allSuccessful
                ? 'Go to Supabase Dashboard → Storage → Create buckets: playback-media, playback-avatars, playback-highlights'
                : undefined
        }

    } catch (error) {
        return {
            success: false,
            error: 'Failed to create storage buckets',
            details: error
        }
    }
}

export async function setupStoragePolicies() {
    try {
        const supabase = createClient()

        // Note: Storage policies are typically created via SQL in the dashboard
        // This is a placeholder for future policy setup via the client

        return {
            success: true,
            message: 'Storage policies should be set up via SQL (already included in schema)'
        }

    } catch (error) {
        return {
            success: false,
            error: 'Failed to setup storage policies',
            details: error
        }
    }
} 