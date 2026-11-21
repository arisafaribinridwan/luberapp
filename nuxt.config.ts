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
    '/register': { auth: { only: 'guest', redirectTo: '/' } },
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
  }
})
