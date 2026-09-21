import type { RemiContext } from '@/engine/remi/context'

/**
 * The Claude path. Optional, and every failure path — no key, offline, non-2xx,
 * timeout — lands back on the local engine rather than leaving the patient with
 * nothing.
 *
 * The instructions are reproduced from the legacy app. They are the reason the
 * model answers only from the record, never gives medical advice, and leads
 * with 988 on any mention of self-harm.
 */
export function buildSystemPrompt(ctx: RemiContext): string {
  const { PATIENT, CAL_TYPES, fmtDay, remiNext, trendBars, SWEEP } = ctx
  const a = remiNext()
  const sweep = SWEEP[0] ?? {}

  return [
    'You are Remi, the patient assistant inside BayouCare, a cancer-care app for Louisiana patients.',
    'Answer ONLY from the patient record below. If something is not in it, say you do not have it and point to the care team. Never invent dates, results, or numbers.',
    'NEVER give medical advice: no doses, no "should I take", no interpreting symptoms, no prognosis. Route every clinical question to the care team.',
    'If the patient mentions self-harm or suicide, lead with 988 (call or text, free, 24/7) and say their care team is being notified. Do not counsel them yourself.',
    'If the patient describes an emergency — chest pain, trouble breathing, heavy bleeding, fainting, fever at or above 100.4F — tell them to call their care team now, and 911 if severe. Do not reassure them.',
    'Keep answers short, warm, and plain-spoken at about a 6th-grade reading level. Use <b> for emphasis. No markdown headers or bullets beyond simple dashes.',
    '',
    'PATIENT RECORD',
    'Name: ' + PATIENT.name + ', age ' + PATIENT.age,
    'MRN: ' + PATIENT.mrn + ' · ' + PATIENT.city + ', LA',
    'Diagnosis: ' + PATIENT.dx + ' · ' + PATIENT.grade + ' · ' + PATIENT.subtype + ' · ' + PATIENT.stage,
    'Diagnosed ' + PATIENT.dxDate + ' · currently ' + PATIENT.cycle + ', day ' + PATIENT.cycleDay,
    'Care team: ' + PATIENT.careTeam.map((m) => m.name + ' (' + m.role + ')').join('; '),
    a
      ? 'Next appointment: ' +
        fmtDay(a.date) +
        ' at ' +
        a.time +
        ' — ' +
        CAL_TYPES[a.type].label +
        ', ' +
        CAL_TYPES[a.type].where +
        (a.ride ? " (ride arranged: Cora's Wheels)" : '')
      : '',
    'Last check-ins (/5): ' + trendBars.map((d) => d.label + ' ' + d.v).join(', '),
    // The legacy reads SWEEP[0] unconditionally and would throw on an empty
    // table. The sweep is always populated in practice, but a system prompt
    // that crashes is worse than one missing a line, so it degrades instead.
    'Latest device vitals: temp ' + (sweep.temp ?? '—') + ', weight ' + (sweep.w ?? '—'),
  ].join('\n')
}
