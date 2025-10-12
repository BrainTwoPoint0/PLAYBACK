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
    // Handle framer-motion and motion package conflicts in workspace
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force all framer-motion imports to use the workspace root framer-motion package
      'framer-motion': path.resolve(__dirname, '../node_modules/framer-motion'),
    };

    // Add workspace root node_modules to resolve modules
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, '../node_modules'),
      path.resolve(__dirname, 'node_modules'),
    ];

    return config;
  },
};

export default nextConfig;
