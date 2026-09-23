import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/fraunces'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@/index.css'

import App from '@/App'
import { installTestSurface } from '@/testSurface'

installTestSurface()

const container = document.getElementById('root')
if (!container) {
  throw new Error('index.html is missing #root')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
