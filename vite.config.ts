import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// GitHub Pages serves a project site under /<repo-name>/. This must match the
// repository name. If you name the repo something other than "coupon", change
// this (and the router uses hash URLs so it works under any subpath).
const BASE = '/coupon/';

export default defineConfig({
  base: BASE,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png'],
      manifest: {
        name: 'קופונים',
        short_name: 'קופונים',
        description: 'ארנק אישי לקופונים, שוברים וכרטיסים',
        lang: 'he',
        dir: 'rtl',
        theme_color: '#208AEF',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the app shell so it works offline after the first visit.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
