import type { ShaderBackgroundVariant } from '@/components/motion/shader-background'

export type DemoAccount = {
  id: string
  name: string
  short: string
  role: string
  email: string
  pass: string
  /** Colored contact shadow under the orb. */
  glow: string
  /** Letter color over the shader face. */
  ink: string
  /** beUI ShaderBackground preset — Paper shaders clipped to the orb. */
  shader: {
    variant: ShaderBackgroundVariant
    props: Record<string, unknown>
  }
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
    glow: 'rgba(249, 115, 22, 0.55)',
    ink: '#fff7ed',
    // Mosaic / stained-glass (beUI voronoi)
    shader: {
      variant: 'voronoi',
      props: { colors: ['#ff8247', '#ffe53d', '#c2410c'], speed: 0.35 },
    },
  },
  {
    id: 'yolanda',
    name: 'Yolanda',
    short: 'Yolanda',
    role: 'Survivorship',
    email: 'yolanda@bayoucare.demo',
    pass: 'yolanda2026',
    glow: 'rgba(45, 212, 191, 0.5)',
    ink: '#f0fdfa',
    // Wavy silk (beUI waves)
    shader: {
      variant: 'waves',
      props: { colorFront: '#2dd4bf', colorBack: '#042f2e', speed: 0.35 },
    },
  },
  {
    id: 'priscilla',
    name: 'Priscilla',
    short: 'Priscilla',
    role: 'In treatment',
    email: 'priscilla@bayoucare.demo',
    pass: 'priscilla2026',
    glow: 'rgba(56, 189, 248, 0.5)',
    ink: '#f0f9ff',
    // Glossy liquid blue (beUI mesh)
    shader: {
      variant: 'mesh-gradient',
      props: {
        colors: ['#e0f2fe', '#38bdf8', '#0369a1', '#082f49'],
        distortion: 0.75,
        swirl: 0.35,
        speed: 0.4,
      },
    },
  },
  {
    id: 'marcus',
    name: 'Marcus',
    short: 'Marcus',
    role: 'Survivorship',
    email: 'marcus@bayoucare.demo',
    pass: 'marcus2026',
    glow: 'rgba(74, 222, 128, 0.5)',
    ink: '#f0fdf4',
    // Metallic / organic blob (beUI metaballs)
    shader: {
      variant: 'metaballs',
      props: {
        colors: ['#86efac', '#22c55e', '#052e16'],
        colorBack: '#052e16',
        speed: 0.45,
      },
    },
  },
  {
    id: 'clinician',
    name: 'Clinician',
    short: 'Clinician',
    role: 'Admin · all patients',
    email: 'clinician@bayoucare.demo',
    pass: 'clinician2026',
    glow: 'rgba(52, 211, 153, 0.55)',
    ink: '#ecfdf5',
    // Pleated / panel folds (beUI color-panels)
    shader: {
      variant: 'color-panels',
      props: {
        colors: ['#6ee7b7', '#34d399', '#0f6b4c', '#022c22'],
        speed: 0.3,
      },
    },
  },
] as const
