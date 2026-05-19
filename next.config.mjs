import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Use remotePatterns (over the deprecated `domains`) to pin allowed
    // hosts strictly. Anything not matched here is rejected by next/image at
    // render time — safer than a wildcard, prevents operator-controlled URLs
    // from being used as third-party tracking pixels.
    remotePatterns: [
      // Sanity CMS — existing PLAYBACK content.
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      // Supabase Storage public buckets — academy team / club logos plus the
      // `graphic-packages` bucket pattern used elsewhere in PLAYHUB.
      {
        protocol: 'https',
        hostname: 'zfaadonrmgfxnwzyudxi.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/player/:username',
        destination: '/p/:username',
        permanent: true,
      },
      {
        // Stripe's subscription cancellation / receipt emails embed
        // https://www.playbacksports.ai/contact as the canned "Support
        // URL" for our account. The homepage's #contact anchor is where
        // that content actually lives, so redirect rather than create a
        // dedicated page. Use 308 (permanent) since the Stripe template
        // doesn't change between emails.
        source: '/contact',
        destination: '/#contact',
        permanent: true,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Handle framer-motion and motion package conflicts
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force all framer-motion imports to use the main framer-motion package
      'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion'),
    };

    return config;
  },
};

export default nextConfig;
