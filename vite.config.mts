import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // Relative asset paths, so `dist/` also runs from file:// — which is how the
  // existing headless-Chrome harnesses in C:\Users\umehc\remi-verify\ drive the
  // app. Without this the built bundle 404s every asset off a file:// origin.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // The API lives in Vercel Functions, so `npm run dev` alone cannot serve
    // /api/*. Run `vercel dev --listen 3000` in a second terminal and this
    // proxy forwards to it. Without it, the login gate fails closed — which is
    // the correct behaviour, it just looks like a dead app.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
