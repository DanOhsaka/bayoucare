/* ============================================================================
   CLINICAL SAFETY — READ BEFORE EDITING

   The answer strings and triage regexes in this file are reproduced VERBATIM
   from the original single-file app, by a generator, not by hand. Do not
   "tidy" them, reflow them, or reformat the prose.

   The triage table is the safety property of this feature: it is evaluated
   BEFORE intent matching, so a message describing a crisis can never fall
   through to a cheerful answer about the appointment calendar. Reordering the
   loops in `remiAnswer` inverts that guarantee.

   Three tiers, in order:
     crisis   -> 988, and the care team is told
     urgent   -> call the care team now, or 911
     clinical -> routed to the care team, never answered

   A fourth outcome, `unknown`, means the question was not in the record. It
   says so. It does not guess.
   ========================================================================= */

import { createIntents } from '@/engine/remi/intents'
import { buildRemiContext } from '@/engine/remi/context'
import { REMI_FALLBACK, REMI_ROUTED, REMI_TRIAGE, type TriageTier } from '@/engine/remi/triage'

export interface RemiAnswer {
  text: string
  tier: TriageTier | 'record' | 'unknown'
  intent?: string
  engine: 'local' | 'cloud'
}

export function remiAnswer(text: string): RemiAnswer | null {
  const raw = String(text == null ? '' : text).trim();
  if (!raw) return null;
  const t = raw.toLowerCase();

  for (const tier of REMI_TRIAGE)
    if (tier.rx.some(r => r.test(t)))
      return {text:REMI_ROUTED[tier.tier](), tier:tier.tier, engine:'local'};

  const REMI_INTENTS = createIntents(buildRemiContext())

  let best: (typeof REMI_INTENTS)[number] | null = null
  let bestScore = 0
  for (const it of REMI_INTENTS){
    const s = it.kw.reduce((n: number, r: RegExp) => n + (r.test(t) ? 1 : 0), 0);
    if (s > bestScore){ best = it; bestScore = s; }
  }
  if (best){
    const out = best.build(raw);
    if (out) return {text:out, tier:'record', intent:best.id, engine:'local'};
  }
  return {text:REMI_FALLBACK, tier:'unknown', engine:'local'};
}
