// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#17212e' },
        {
          'http-equiv': 'Content-Security-Policy',
          content: 'upgrade-insecure-requests' 
        }
      ]
    }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', 'nuxt-auth-utils'],
  css: ['~/assets/css/main.css', '~/assets/css/admin.css'],
  vite: {
    server: {
      allowedHosts: ['.ngrok-free.dev']
    }
  },
  runtimeConfig: {
    databaseUrl: '',
    setupKey: '',
    session: {
      maxAge: 60 * 60 * 12,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      }
    }
  },
  typescript: {
    strict: true
  }
})
