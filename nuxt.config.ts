export default defineNuxtConfig({
  compatibilityDate: '2025-06-10',
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@nuxtjs/supabase'],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'ReelSpace — Upload vidéo sécurisé',
      meta: [
        { name: 'description', content: 'Uploadez vos vidéos et partagez un lien direct en quelques secondes.' },
        { name: 'theme-color', content: '#070b14' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/login', '/confirm', '/v/**'],
      saveRedirectToCookie: true,
    },
    clientOptions: {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
      },
    },
  },

  runtimeConfig: {
    public: {
      appName: 'ReelSpace',
      maxVideoSizeMb: 100,
    },
  },

  nitro: {
    preset: 'vercel',
    externals: {
      inline: ['@vueuse/core', '@vueuse/shared', 'cookie'],
    },
  },

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  build: {
    transpile: ['@supabase/ssr'],
  },
})
