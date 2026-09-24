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
  /** beUI ShaderBackground preset — same faces as the cylinder-carousel docs. */
  shader: {
    variant: ShaderBackgroundVariant
    props: Record<string, unknown>
  }
}

/**
 * Demo roster. Orb shaders match the beUI Cylinder Carousel preview slides
 * (https://beui.dev/components/motion/cylinder-carousel).
 */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    id: 'patient',
    name: 'Darlene',
    short: 'Darlene',
    role: 'In treatment',
    email: 'patient@bayoucare.demo',
    pass: 'patient2026',
    glow: 'rgba(185, 140, 255, 0.55)',
    shader: {
      variant: 'dithering',
      props: { colorBack: '#1a1030', colorFront: '#b98cff', speed: 0.3 },
    },
  },
  {
    id: 'marcus',
    name: 'Marcus',
    short: 'Marcus',
    role: 'Survivorship',
    email: 'marcus@bayoucare.demo',
    pass: 'marcus2026',
    glow: 'rgba(201, 185, 168, 0.5)',
    shader: {
      variant: 'metaballs',
      props: {
        colors: ['#e8e8ef', '#8a8a9a', '#1a1a22'],
        colorBack: '#c9b9a8',
        speed: 0.4,
      },
    },
  },
  {
    id: 'yolanda',
    name: 'Yolanda',
    short: 'Yolanda',
    role: 'Survivorship',
    email: 'yolanda@bayoucare.demo',
    pass: 'yolanda2026',
    glow: 'rgba(200, 255, 0, 0.45)',
    shader: {
      variant: 'warp',
      props: {
        colors: ['#c8ff00', '#3a5a00', '#c8ff00', '#88bb00'],
        speed: 0.4,
      },
    },
  },
  {
    id: 'priscilla',
    name: 'Priscilla',
    short: 'Priscilla',
    role: 'In treatment',
    email: 'priscilla@bayoucare.demo',
    pass: 'priscilla2026',
    glow: 'rgba(106, 123, 255, 0.55)',
    shader: {
      variant: 'god-rays',
      props: {
        colors: ['#6a7bff', '#00114d'],
        colorBack: '#000000',
        speed: 0.5,
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
    glow: 'rgba(255, 106, 61, 0.5)',
    shader: {
      variant: 'swirl',
      props: {
        colorBack: '#1a0000',
        colors: ['#ffd1a8', '#ff6a3d', '#b31a57'],
        speed: 0.3,
      },
    },
  },
] as const
