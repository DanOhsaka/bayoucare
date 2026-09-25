import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { remiApiPlugin } from './vite-plugin-remi-api'

export default defineConfig(({ mode }) => {
  // Empty prefix so DEEPSEEK_API_KEY (server-only) is available to the Remi
  // middleware — Vite still never exposes non-VITE_ keys to the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // Relative asset paths, so `dist/` also runs from file:// — which is how the
    // existing headless-Chrome harnesses in C:\Users\umehc\remi-verify\ drive the
    // app. Without this the built bundle 404s every asset off a file:// origin.
    base: './',
    plugins: [react(), tailwindcss(), remiApiPlugin(env)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // Login and the rest of /api live in Vercel Functions. Run
      // `vercel dev --listen 3000` in a second terminal and this proxy forwards
      // to it. Remi + session cold-check are handled in-process so the landing
      // page still opens when that second process is missing.
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          bypass(req) {
            const path = req.url?.split('?')[0]
            if (
              path === '/api/remi' ||
              path === '/api/session' ||
              path === '/api/logout' ||
              path === '/api/login'
            ) {
              return req.url
            }
          },
        },
      },
    },
  }
})
