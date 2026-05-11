import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Winds & Echoes',
        short_name: 'W&E',
        description: 'Adventure travel blog — author dashboard',
        theme_color: '#2C5F2E',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Cache app shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        // Background sync for offline photo uploads
        backgroundSync: {
          name: 'photo-upload-queue',
          options: { maxRetentionTime: 24 * 60 }, // 24 hours
        },
        runtimeCaching: [
          {
            // Cache pipeline API responses briefly
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxAgeSeconds: 300 }, // 5 min
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to pipeline server in dev
      '/api': 'http://localhost:3001',
    },
  },
});
