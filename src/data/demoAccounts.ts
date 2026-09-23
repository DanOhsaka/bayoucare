export type DemoAccount = {
  id: string
  name: string
  short: string
  role: string
  email: string
  pass: string
  /** Spherical body gradient (lit from upper-left). */
  face: string
  /** Colored contact shadow / glow under the orb. */
  glow: string
  ink: string
}

/** Shared demo roster — carousel page + login prefill. */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    id: 'patient',
    name: 'Darlene',
    short: 'Darlene',
    role: 'In treatment',
    email: 'patient@bayoucare.demo',
    pass: 'patient2026',
    face: 'radial-gradient(circle at 32% 28%, #fdba74 0%, #f97316 38%, #c2410c 72%, #431407 100%)',
    glow: 'rgba(249, 115, 22, 0.55)',
    ink: '#fff7ed',
  },
  {
    id: 'yolanda',
    name: 'Yolanda',
    short: 'Yolanda',
    role: 'Survivorship',
    email: 'yolanda@bayoucare.demo',
    pass: 'yolanda2026',
    face: 'radial-gradient(circle at 32% 28%, #99f6e4 0%, #2dd4bf 36%, #0f766e 70%, #042f2e 100%)',
    glow: 'rgba(45, 212, 191, 0.5)',
    ink: '#f0fdfa',
  },
  {
    id: 'priscilla',
    name: 'Priscilla',
    short: 'Priscilla',
    role: 'In treatment',
    email: 'priscilla@bayoucare.demo',
    pass: 'priscilla2026',
    face: 'radial-gradient(circle at 32% 28%, #bae6fd 0%, #38bdf8 36%, #0369a1 70%, #082f49 100%)',
    glow: 'rgba(56, 189, 248, 0.5)',
    ink: '#f0f9ff',
  },
  {
    id: 'marcus',
    name: 'Marcus',
    short: 'Marcus',
    role: 'Survivorship',
    email: 'marcus@bayoucare.demo',
    pass: 'marcus2026',
    face: 'radial-gradient(circle at 32% 28%, #bbf7d0 0%, #4ade80 36%, #15803d 70%, #052e16 100%)',
    glow: 'rgba(74, 222, 128, 0.5)',
    ink: '#f0fdf4',
  },
  {
    id: 'clinician',
    name: 'Clinician',
    short: 'Clinician',
    role: 'Admin · all patients',
    email: 'clinician@bayoucare.demo',
    pass: 'clinician2026',
    face: 'radial-gradient(circle at 32% 28%, #6ee7b7 0%, #34d399 32%, #0f6b4c 68%, #022c22 100%)',
    glow: 'rgba(52, 211, 153, 0.55)',
    ink: '#ecfdf5',
  },
] as const
