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

import type { RemiContext } from '@/engine/remi/context'

/**
 * The 20 record-grounded intents, as a factory.
 *
 * They are a factory rather than a module-level array because the extracted
 * code reads `PATIENT`, `CAL_TYPES`, `trendBars` and friends as bare
 * identifiers — exactly as the legacy file did, where they were module-scope
 * variables rebound on a patient switch. Taking them as factory locals keeps
 * the source untouched while giving it the current patient's values.
 */
export function createIntents(ctx: RemiContext) {
  const {
    PATIENT,
    CAL_TYPES,
    trendBars,
    vitalsAlerts,
    answers,
    SWEEP,
    TRIALS,
    T,
    fmtDay,
    remiNext,
    remiUpcoming,
    apptLine,
    remiDayLookup,
  } = ctx

  return [
  { id:'nextappt', kw:[/\bnext appointment\b/, /\bnext (visit|appt)\b/, /when.*\b(appointment|appt|visit|infusion)\b/, /\bcoming up\b/, /\bwhat.?s next for me\b/],
    build(){
      const a = remiNext();
      if (!a) return `Nothing is on your calendar right now.`;
      return `Your next appointment is ${apptLine(a)}.<br><br>` +
        (a.ride
          ? `🚗 A ride is already arranged — <b>Cora's Wheels</b>, pickup 7:45 am. Nothing for you to do.`
          : `No ride is booked for this one yet. You can ask for one on the <b>Access &amp; Help</b> tab, or tell Keisha (social worker).`) +
        `<br><br>Everything on your schedule is on the <b>Appointments</b> tab.`;
    }},

  { id:'day', kw:[/\btoday\b/, /\btomorrow\b/, /\bthis week\b/, /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/, /\b(mon|tue|wed|thu|fri|sat|sun)\b/],
    build(t: string){
      const hit = remiDayLookup(t);
      if (!hit) return null;
      if (!hit.list.length)
        return `<b>${fmtDay(hit.date)}</b> — nothing scheduled. A good day to rest.`;
      return `<b>${fmtDay(hit.date)}:</b><br><br>` + hit.list.map(a => {
        const c = CAL_TYPES[a.type];
        return `• ${c.ico} <b>${a.time}</b> — ${c.label}, ${c.where}${a.ride ? ' · 🚗 ride arranged' : ''}`;
      }).join('<br>') + `<br><br>Full calendar is on the <b>Appointments</b> tab.`;
    }},

  { id:'scans', kw:[/\bscans?\b/, /\bimaging\b/, /\bct\b/, /\bmri\b/, /\bmammogram\b/, /\bx-?ray\b/],
    build(){
      const imgs = remiUpcoming().filter(a => a.type === 'imaging');
      if (!imgs.length) return `No scans are on your calendar right now.`;
      const [a, b] = imgs;
      return `Your next scan is ${apptLine(a)}.<br><br>` +
        (b ? `After that: ${fmtDay(b.date)} at ${b.time}.<br><br>` : '') +
        `Results get explained in plain words on the <b>Understand</b> tab — and Dr. Peters goes through them with you.`;
    }},

  { id:'dx', kw:[/\bdiagnos/, /what do i have/, /what.?s wrong with me/, /\bmy cancer\b/, /what kind of cancer/, /\bmy condition\b/],
    build(){ return `From your record: <b>${PATIENT.dx}</b>.<br><br>` +
      `${PATIENT.grade} · ${PATIENT.subtype} · ${PATIENT.stage}<br>` +
      `Diagnosed ${PATIENT.dxDate} — you're on <b>${PATIENT.cycle}</b>, day ${PATIENT.cycleDay}.<br><br>` +
      `The <b>Understand</b> tab walks through what each of those terms means, in plain words.`; }},

  { id:'stage', kw:[/\bstage\b/, /\bsubtype\b/, /\breceptors?\b/, /\ber\b|\bpr\b|\bher2\b/, /grade/],
    build(){ return `<b>${PATIENT.stage}</b> — ${PATIENT.subtype}, ${PATIENT.grade}.<br><br>` +
      `In plain words: the cancer is in the breast (not spread beyond it), it is driven by hormones (ER+ and PR+), and it is not driven by the HER2 protein. That combination is why your team chose this treatment.<br><br>` +
      `The <b>Understand</b> tab explains each marker with the ASCO-aligned wording your team uses.`; }},

  { id:'treatment', kw:[/\btreatment so far\b/, /what have i (had|done)/, /\bchemo\b/, /chemotherapy/, /\bsurgery\b/, /\bhistory\b/, /\bso far\b/],
    build(){ return `<b>Where you are in treatment</b><br><br>` +
      `• ${T('journey.j3tw')} — ${T('journey.j3td')}<br>` +
      `• ${T('journey.j4tw')} — ${T('journey.j4td')}<br><br>` +
      `Coming up: ${T('journey.j5tw')} — ${T('journey.j5td')}<br><br>` +
      `Your whole timeline is on the <b>My Journey</b> tab, checked off as you go.`; }},

  { id:'plan', kw:[/\bmy plan\b/, /survivorship/, /\bnext step\b/, /\bwhat.?s next\b/, /the plan\b/, /\btreatment plan\b/],
    build(){ return `<b>Your plan</b><br><br>` +
      `${T('journey.j2tw')} — ${T('journey.j2td')}<br><br>` +
      `Right now: <b>${PATIENT.cycle}</b>, day ${PATIENT.cycleDay}.<br><br>` +
      `Then: ${T('journey.j6tw')} — ${T('journey.j6td')}<br><br>` +
      `It's all on the <b>My Journey</b> tab, and Dr. Peters reviews it with you at each visit.`; }},

  { id:'feeling', kw:[/\bfeeling\b/, /\bhow am i doing\b/, /\bcheck.?ins?\b/, /\bmood\b/, /\benergy\b/, /\btrend\b/, /\bnausea\b/],
    build(){
      const n = trendBars.length, avg = trendBars.reduce((s, d) => s + d.v, 0) / n;
      const done = Object.keys(answers).length;
      return `Your last <b>${n} check-ins</b> average <b>${avg.toFixed(1)}/5</b> on how you've been feeling.<br><br>` +
        trendBars.map(d => `${d.label} <b>${d.v}</b>`).join(' · ') + `<br><br>` +
        (done
          ? `Today's check-in is partly done — ${done} question${done === 1 ? '' : 's'} answered so far.`
          : `Today's check-in isn't logged yet — it takes about a minute, and your nurse sees it the same day.`) +
        `<br><br>Your care team watches this trend on the <b>Check-ins</b> tab.`;
    }},

  { id:'vitals', kw:[/\btemp/, /\bweight\b/, /\bweigh\b/, /\bvitals?\b/, /\bdevices?\b/, /\bscale\b/, /\bpatch\b/],
    build(){
      const me = SWEEP[0];
      return `Latest from your devices:<br><br>🌡️ Temp <b>${me.temp}</b><br>⚖️ Weight <b>${me.w}</b> (${me.wd} over 7 days)<br><br>` +
        `Your temp patch and scale stream into the same alert engine as your check-ins — a fever at 2 am doesn't wait until morning. See the <b>Vitals</b> tab.`;
    }},

  { id:'alerts', kw:[/\balerts?\b/, /\bwarning/, /\bflagged\b/, /\banything wrong\b/, /\bconcerning\b/],
    build(){
      if (!vitalsAlerts.length)
        return `No alerts on your record right now — your recent device readings and check-ins are in your normal range.<br><br>If anything changes, the <b>Vitals</b> tab shows what your nurse would see.`;
      return `<b>Alerts on your record:</b><br><br>` + vitalsAlerts.map(v =>
        `🚨 <b>${v.when}</b> — ${v.reading}: ${v.msg}<br>${v.followup}`).join('<br><br>') +
        `<br><br>This already went to your care team. The <b>Vitals</b> tab has the full replay.`;
    }},

  { id:'rides', kw:[/\brides?\b/, /\btransport/, /\bget there\b/, /\bdrive\b/, /\bmileage\b/, /\blodging\b/, /\bget a ride\b/],
    build(){
      const a = remiNext();
      return `🚗 <b>Getting to your appointments</b><br><br>` +
        (a && a.ride
          ? `<b>${fmtDay(a.date)}</b> is already covered — Cora's Wheels (non-emergency medical transport) is confirmed, pickup 7:45 am.<br><br>`
          : '') +
        `<b>Mileage reimbursement</b> — you may qualify for about <b>$0.655/mile</b> through the Louisiana Cancer Fund; your round trip is 92 miles.<br><br>` +
        `<b>Free lodging near Ochsner Baton Rouge</b> — a partner room is available if a treatment day runs long.<br><br>` +
        `Need a ride that isn't booked? Keisha (social worker) arranges them — <b>Access &amp; Help</b> → Request help.`;
    }},

  { id:'money', kw:[/\bcost/, /\bpay\b/, /\bafford\b/, /\bmoney\b/, /\bfinancial\b/, /\bcopay/, /\binsurance\b/, /\bmedicaid\b/, /\bbills?\b/],
    build(){ return `💰 <b>Help paying for care</b><br><br>` +
      `<b>Copay assistance</b> — 2 programs matched your treatment, averaging <b>$1,900/yr</b> in savings.<br><br>` +
      `<b>Medicaid navigation</b> — a step-by-step renewal guide with a caseworker chat line.<br><br>` +
      `<b>Mileage reimbursement</b> — about $0.655/mile through the Louisiana Cancer Fund.<br><br>` +
      `Keisha Brown (social worker) handles financial and transport help — send her a request from <b>Access &amp; Help</b>.`; }},

  { id:'team', kw:[/\bcare team\b/, /\bmy team\b/, /\bwho.*(doctor|nurse|team|social worker)\b/, /\bmy (doctor|oncologist)\b/],
    build(){ return `Your care team:<br><br>` + PATIENT.careTeam.map(m =>
      `• <b>${m.name}</b> — ${m.role}${m.org ? ' · ' + m.org : ''}${m.note ? ' · ' + m.note : ''}`).join('<br>') +
      `<br><br>They're also on the <b>Home</b> tab, and you can send Keisha a request any time from <b>Access &amp; Help</b>.`; }},

  { id:'where', kw:[/\bwhere do i go\b/, /\bdirections?\b/, /\baddress\b/, /\blocation\b/, /\bwhich building\b/, /\bwhere is\b/],
    build(){
      const a = remiNext();
      if (!a) return `Most of your care is at <b>Rapides Regional</b> in Alexandria.`;
      return `Your next visit is at <b>${CAL_TYPES[a.type].where}</b>.<br><br>` +
        `Most of your care is at <b>Rapides Regional</b> in Alexandria — labs, imaging, and the infusion suite are all in that building. Dr. Peters sees you at <b>Ochsner Baton Rouge</b> for oncology follow-ups.<br><br>` +
        `Your ride is set for 7:45 am, so you'll have time to check in.`;
    }},

  { id:'bring', kw:[/\bbring\b/, /\bwhat should i (expect|have)/, /\bprepare\b/, /\bhow long (will|does) (it|the visit|infusion)\b/],
    build(){ return `For most visits: your <b>photo ID</b>, your <b>insurance card</b>, and a current list of your medications.<br><br>` +
      `For infusion days — about <b>${CAL_TYPES.infusion.dur} minutes</b> in the chair — bring a charger, a blanket, and something to eat. It's a long sit.<br><br>` +
      `If you're unsure about a specific visit, Marie Thibodeaux (your nurse navigator) can tell you exactly what to expect.`; }},

  { id:'support', kw:[/\bsupport\b/, /\btalk to someone\b/, /\bcounsel/, /\bpeer\b/, /\btherapy\b/, /\bmental health\b/],
    build(){ return `👭 <b>Support group — Central LA</b><br>Meets the 2nd &amp; 4th Tuesday at 6 pm in Alexandria. Childcare is on site.<br><br>` +
      `<b>NAMI Louisiana</b> (nami-louisiana.org) runs free peer support groups.<br><br>` +
      `If you'd rather talk to someone on your own team first, <b>Keisha Brown</b> (social worker) is there for exactly this — <b>Access &amp; Help</b> → Request help.<br><br>` +
      `And if things feel heavy right now, <b>988</b> is free, 24/7, and confidential.`; }},

  { id:'trials', kw:[/\btrials?\b/, /\bclinical trial\b/, /\bstudy\b/, /\benroll\b/, /\beligib/],
    build(){
      const scored = TRIALS.map(t => ({t, pass:t.crits.filter(c => c.ok === true).length, tot:t.crits.length}))
                           .sort((a, b) => (b.pass / b.tot) - (a.pass / a.tot));
      const best = scored[0];
      if (!best) return `No trials are loaded right now.`;
      return `🔬 <b>TrialMatch</b><br><br>Your profile was checked against <b>${TRIALS.length} trials</b> near Louisiana. The closest is <b>${best.t.nct}</b> — ${best.pass} of ${best.tot} criteria met:<br><br>` +
        best.t.crits.map(c => `${c.ok === true ? '✅' : c.ok === 'warn' ? '⚠️' : '❌'} ${c.txt}`).join('<br>') +
        `<br><br>Nothing matches every criterion yet, and eligibility is a call for your oncology team — not something I'd guess at. The full list is on <b>Access &amp; Help</b>.`;
    }},

  { id:'cando', kw:[/\bwhat can you do\b/, /\bhow can you help\b/, /\bwhat do you do\b/, /\byour features\b/],
    build(){ return `I read <b>your own record</b> and answer from it. I can help with:<br><br>` +
      `• Your diagnosis, stage, and what the terms mean<br>` +
      `• Your plan and where you are in treatment<br>` +
      `• Your next appointment, or what's on any day<br>` +
      `• How you've been feeling, and your device readings<br>` +
      `• Rides, costs, support groups, and clinical trials<br>` +
      `• Who's on your care team and how to reach them<br><br>` +
      `What I <b>won't</b> do is give medical advice. Medication and symptom questions go to Dr. Peters or Marie, RN — I'll tell you so rather than guess.`; }},

  { id:'privacy', kw:[/\bprivate\b/, /\bprivacy\b/, /\bwho can see\b/, /\bis this secure\b/, /\bdata\b/, /\brecorded\b/],
    build(){ return `By default everything I say is generated <b>on this device</b> from your own record — no network, nothing leaves the phone.<br><br>` +
      `If a model is connected in the settings below, only then does your question and a summary of your record go to Anthropic to be phrased. The key stays in this browser and is never written into the app.<br><br>` +
      `Your care team sees the same record they always have.`; }},

  { id:'whoareyou', kw:[/\bwho are you\b/, /\bare you (a )?(doctor|real|human)\b/, /\bare you an ai\b/, /\bwhat are you\b/, /\byour name\b/],
    build(){ return `I'm <b>Remi</b> — the assistant inside BayouCare. I'm not a doctor and I'm not on your care team.<br><br>` +
      `What I am is a reader of your record: I can tell you your diagnosis, your plan, your appointments, your rides and costs, and who to call.<br><br>` +
      `Anything clinical goes to <b>Dr. Simone Peters</b> (oncologist) or <b>Marie Thibodeaux, RN</b> (navigator). Every answer I give carries that reminder.`; }}
]
}
