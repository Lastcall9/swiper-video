export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  components: [
    {
      path: '~/components',
      pathPrefix: false,
      extensions: ['vue']
    }
  ],
  vite: {
    optimizeDeps: {
      include: [
        '@vueuse/core',
        'swiper/vue',
        'xgplayer',
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_API_BASE || '',
      googleClientId: process.env.NUXT_GOOGLE_CLIENT_ID || '',
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
      googleInviteCodeRequired: (() => {
        const raw = process.env.NUXT_PUBLIC_GOOGLE_INVITE_CODE_REQUIRED
          ?? process.env.NUXT_GOOGLE_INVITE_CODE_REQUIRED
        if (raw === undefined || raw === '') return true
        const normalized = raw.toLowerCase()
        return !['0', 'false', 'off', 'no'].includes(normalized)
      })()
    }
  },
  compatibilityDate: '2026-07-05'
})
