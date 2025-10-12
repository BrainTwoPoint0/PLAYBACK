import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.sanity.io'],
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
