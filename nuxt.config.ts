// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/better-auth',
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/**': { auth: { only: 'user', redirectTo: '/' } },
    '/': { auth: false },
    '/login': { auth: { only: 'guest', redirectTo: '/' } },
    '/two-factor': { auth: false },
    '/admin': { auth: { only: 'user', user: { role: 'admin' }, redirectTo: '/' } },
    '/admin/**': { auth: { only: 'user', user: { role: 'admin' }, redirectTo: '/' } },
    '/settings': { auth: { only: 'user', user: { role: 'admin' }, redirectTo: '/' } },
    '/settings/**': { auth: { only: 'user', user: { role: 'admin' }, redirectTo: '/' } },
    '/transfers': { auth: { only: 'user', user: { role: 'admin' }, redirectTo: '/' } },
    '/transfers/**': { auth: { only: 'user', user: { role: 'admin' }, redirectTo: '/' } },
    '/transactions': { auth: { only: 'user', user: { role: ['pengurus', 'admin'] }, redirectTo: '/' } },
    '/transactions/**': { auth: { only: 'user', user: { role: ['pengurus', 'admin'] }, redirectTo: '/' } }
  },

  compatibilityDate: '2026-06-30',

  auth: {
    redirects: {
      login: '/',
      guest: '/',
      authenticated: '/',
      logout: '/',
      sessionExpired: '/'
    },
    preserveRedirect: true
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  fonts: {
    providers: {
      google: false,
      bunny: false,
      fontsource: false,
      fontshare: false
    }
  },

  pwa: {
    registerType: 'prompt',
    manifest: {
      name: 'Luber - Lunas Bersama',
      short_name: 'Luber',
      description: 'Pencatatan keuangan komunitas Luber.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#F7F8FA',
      theme_color: '#2A41CB',
      lang: 'id',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    generateSW: {
      navigateFallback: '/offline.html',
      navigateFallbackDenylist: [/^\/api\//, /^\/auth\//, /^\/_auth\//],
      runtimeCaching: [
        {
          urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'public-images',
            expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 },
            cacheableResponse: { statuses: [200] }
          }
        },
        {
          urlPattern: /\/(?:api|auth)\//,
          handler: 'NetworkOnly'
        }
      ],
      cleanupOutdatedCaches: true
    },
    devOptions: {
      enabled: false
    }
  }
})
