import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'Doucement — Habitudes progressives',
        short_name: 'Doucement',
        description: 'Application de suivi d\'habitudes progressives, sans culpabilité',
        theme_color: '#F27D16',
        background_color: '#FEF7F0',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'fr',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'icon-maskable.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Check-in rapide',
            short_name: 'Check-in',
            description: 'Enregistrer rapidement vos habitudes du jour',
            url: '/quick-checkin',
            icons: [{ src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }],
          },
          {
            name: 'Nouvelle habitude',
            short_name: 'Ajouter',
            description: 'Créer une nouvelle habitude',
            url: '/create',
            icons: [{ src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Release notes: NetworkFirst to always get latest version
            urlPattern: /\/release-notes\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'release-notes-cache',
              expiration: {
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      // Inject custom service worker code for notification handling
      injectManifest: undefined,
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
