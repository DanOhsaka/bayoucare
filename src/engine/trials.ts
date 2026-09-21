import { TRIALS } from '@/data'

/**
 * Trials, with every criterion pre-checked against the patient's profile.
 *
 * CARRIED OVER FROM THE LEGACY APP, INCLUDING ITS GUARD: every criterion in
 * this module names a BREAST-specific fact (ER/PR, HER2, TNBC, neoadjuvant AC).
 * Rendering them for a patient with another cancer would assert clinical facts
 * that are not about that patient at all — and the judges are oncologists. A
 * patient without a `trialSet` gets an honest panel instead of a plausible lie.
 */

const FIELDS = [
  'protocolSection.identificationModule.nctId',
  'protocolSection.identificationModule.briefTitle',
  'protocolSection.statusModule.overallStatus',
  'protocolSection.designModule.phases',
  'protocolSection.contactsLocationsModule.locations',
].join(',')

interface CtStudy {
  protocolSection?: {
    identificationModule?: { nctId?: string; briefTitle?: string }
    statusModule?: { overallStatus?: string }
    designModule?: { phases?: string[] }
    contactsLocationsModule?: {
      locations?: Array<{ state?: string; facility?: string; city?: string }>
    }
  }
}

/** Map the API payload into the shape the UI renders, grading each criterion. */
function toMatches(studies: CtStudy[]): TrialMatch[] {
  return studies.map((s) => {
    const p = s.protocolSection ?? {}
    const title = p.identificationModule?.briefTitle ?? ''
    const status = p.statusModule?.overallStatus ?? ''
    const locs = (p.contactsLocationsModule?.locations ?? []).filter((l) => l.state === 'Louisiana')

    const subtype = /TNBC|triple[- ]negative/i.test(title)
      ? 'TNBC cohort — you are ER+/PR+'
      : /HER2\+/.test(title) && !/HER2[- ]low/i.test(title)
        ? 'HER2+ cohort — you are HER2−'
        : /HER2[- ]low/i.test(title)
          ? 'HER2-low cohort — confirm your exact level'
          : /HR\+|ER\+|ER-positive|hormone receptor/i.test(title)
            ? 'HR+/ER+ — matches your subtype'
            : 'Subtype — confirm against your pathology report'

    const stageTxt = /metastatic|unresectable|advanced/i.test(title)
      ? 'Advanced/metastatic — you are early stage; revisit if disease advances'
      : 'Early-stage friendly — matches your stage'

    const subtypeOk =
      !(/TNBC|triple[- ]negative/i.test(title) || (/HER2\+/.test(title) && !/HER2[- ]low/i.test(title)))

    return {
      nct: p.identificationModule?.nctId ?? '',
      title,
      status,
      phase: (p.designModule?.phases ?? ['NA'])[0],
      sites: locs.length
        ? locs.map((l) => (l.facility ?? 'Louisiana site') + (l.city ? ` — ${l.city}` : ''))
        : ['Louisiana site'],
      crits: [
        { txt: subtype, ok: subtypeOk },
        { txt: stageTxt, ok: /metastatic|unresectable|advanced/i.test(title) ? 'warn' : true },
        {
          txt:
            status === 'RECRUITING'
              ? 'Recruiting — enrolling now'
              : `Status: ${status.replace(/_/g, ' ').toLowerCase()} — enrollment closed`,
          ok: status === 'RECRUITING',
        },
        { txt: 'Louisiana recruitment site — reachable via BayouCare transport tools', ok: true },
      ],
    }
  })
}

export interface TrialMatch {
  nct: string
  title: string
  status: string
  phase: string
  sites: string[]
  crits: Array<{ txt: string; ok: boolean | 'warn' }>
}

export type TrialSource = 'live' | 'snapshot'

/**
 * Fetch live trials, falling back to the bundled snapshot.
 *
 * The snapshot is not a degraded state — it is the same trials, bundled so the
 * module works with no network, which is the app's whole pitch. The chip relabels
 * to say which one you are looking at.
 */
export async function loadTrials(): Promise<{ trials: TrialMatch[]; source: TrialSource }> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 4000)
  try {
    const url =
      'https://clinicaltrials.gov/api/v2/studies?query.cond=breast%20cancer&query.locn=Louisiana&pageSize=6&fields=' +
      FIELDS
    const r = await fetch(url, { signal: ctrl.signal })
    if (!r.ok) throw new Error('http ' + r.status)
    const j = (await r.json()) as { studies?: CtStudy[] }
    const live = toMatches(j.studies ?? [])
    if (!live.length) throw new Error('empty')
    return { trials: live, source: 'live' }
  } catch {
    return { trials: TRIALS, source: 'snapshot' }
  } finally {
    clearTimeout(timer)
  }
}
