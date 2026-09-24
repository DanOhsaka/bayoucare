import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'

import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/fraunces'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@/index.css'

import App from '@/App'
import { ClerkSessionSync } from '@/components/auth/ClerkSessionSync'
import { installTestSurface } from '@/testSurface'

installTestSurface()

const container = document.getElementById('root')
if (!container) {
  throw new Error('index.html is missing #root')
}

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

createRoot(container).render(
  <StrictMode>
    {publishableKey ? (
      <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
        {/* Mount point for Clerk bot protection — keep off-screen so it never
            paints a white CAPTCHA/broken-image square on the landing page. */}
        <div
          id="clerk-captcha"
          data-cl-theme="dark"
          data-cl-size="compact"
          aria-hidden="true"
          className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
        />
        <ClerkSessionSync />
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)

