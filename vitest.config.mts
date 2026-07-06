import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    server: {
      deps: {
        // next-intl must be inlined so the 'next/server' alias below applies
        // to its ESM imports.
        inline: ['next-intl'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // next-intl's ESM build imports the extensionless 'next/server',
      // which Node's ESM resolver rejects outside the Next runtime.
      'next/server': path.resolve(__dirname, './node_modules/next/server.js'),
    },
  },
});
