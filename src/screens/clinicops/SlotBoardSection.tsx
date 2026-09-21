import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WAITLIST } from '@/data'
import {
  NO_SHOW_HI,
  SLOT_ACTIONS,
  SLOT_ACTION_KEYS,
  noShowOf,
  rebookPlan,
  slotActionKey,
  slotBand,
  slotKey,
  slotPatient,
  type Applied,
  type RebookRow,
  type Slot,
  type SlotActionKey,
  type SlotBand,
} from '@/engine/clinic/slots'
import { useInterval } from '@/hooks/useInterval'
import { cn } from '@/lib/utils'
import { useClinic } from '@/store/clinic'
import { TEAM_PATIENTS, useTeam } from '@/store/team'

/**
 * Rank 13 — no-show model + smart rebooking.
 *
 * The board and the detail card from the legacy's Rank 13 block, with all the
 * arithmetic left in `@/engine/clinic/slots`. Day selection lives in the clinic
 * store (`slotDay`) rather than local state, matching the sibling Clinic Ops
 * panels; the rebooking pass's queue and log are this screen's own.
 *
 * The demo moment is the coupling: `plan` is scored from `useTeam().applied`,
 * so applying "Arrange rides (NEMT)" on the Care Team tab moves these numbers
 * with no shared code beyond `factorsFor()`.
 */

/** Band → chip, on the tint/tint/solid ramp. */
const BAND_BADGE: Record<SlotBand, 'success' | 'warning' | 'solid-danger'> = {
  lo: 'success',
  md: 'warning',
  hi: 'solid-danger',
}

/**
 * Band → day cell. The top band is the SOLID coral with `text-on-danger` — the
 * paired foreground for a saturated fill. `text-danger-fg` is a tint foreground
 * and does not clear contrast on `bg-danger`.
 */
const BAND_CELL: Record<SlotBand, string> = {
  lo: 'border-success bg-success-bg text-success-fg',
  md: 'border-warning bg-warning-bg text-warning-fg',
  hi: 'border-danger bg-danger text-on-danger',
}

export function SlotBoardSection() {
  const teamApplied = useTeam((s) => s.applied)
  const slotDay = useClinic((s) => s.slotDay)
  const setSlotDay = useClinic((s) => s.setSlotDay)
  const slotApplied = useClinic((s) => s.slotApplied)
  const applyRebooking = useClinic((s) => s.applyRebooking)

  /*
   * Both halves of the applied state in one memo: the Rank 1 worklist keyed by
   * patient id, and the slot actions. Reading the team store here — rather than
   * copying a patient's factors into state — is what keeps the two tabs on one
   * model. The factors themselves are recomputed in the engine on every read.
   */
  const applied = useMemo<Applied>(
    () => ({ team: teamApplied, slots: slotApplied }),
    [teamApplied, slotApplied],
  )
  const plan = useMemo(() => rebookPlan(applied), [applied])

  /** The board is patient-major — regroup the scored rows once per plan. */
  const rowsByPatient = useMemo(() => {
    const m = new Map<string, RebookRow[]>()
    for (const r of plan.rows) {
      const list = m.get(r.s.pid)
      if (list) list.push(r)
      else m.set(r.s.pid, [r])
    }
    return m
  }, [plan])

  const dayRows = plan.rows.filter((r) => r.s.day === slotDay)

  /* --------------------------------------------------- the rebooking pass */

  const [log, setLog] = useState<string[]>([])
  const [pass, setPass] = useState<{ queue: RebookRow[]; i: number } | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  // The legacy kept the log pinned to its own bottom as lines arrived.
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log])

  // `useInterval` clears on unmount and on a null ms, so navigating away mid
  // pass stops it — the legacy's `setInterval` kept running against a DOM that
  // was no longer on screen.
  useInterval(
    () => {
      if (!pass) return
      const { queue, i } = pass
      if (i >= queue.length) {
        setPass(null)
        toast('✅ Rebooking pass complete — slots protected and reminders queued.')
        return
      }
      const x = queue[i]
      const p = slotPatient(x.s)
      // The legacy branched on the risk here, but the queue IS `plan.protect`,
      // so it is always the 'protect' arm that runs. Kept as written.
      const action: SlotActionKey = x.p >= NO_SHOW_HI ? 'protect' : 'smsLadder'
      const key = slotActionKey(x.s.pid, x.s.day, action)
      applyRebooking([key])
      // Score the line against the action we just queued, rather than waiting a
      // render for the store to catch up.
      const after = noShowOf(x.s, { team: applied.team, slots: new Set([...applied.slots, key]) })
      setLog((l) => [
        ...l,
        `${x.s.day}/${x.s.time}  ${p ? p.name : ''} — ${Math.round(x.p * 100)}% → ${Math.round(
          after * 100,
        )}% · ${x.s.res}`,
      ])
      setPass({ queue, i: i + 1 })
    },
    pass ? 700 : null,
  )

  function runPass() {
    if (pass) return
    const queue = plan.protect.slice(0, 6)
    if (!queue.length) {
      toast('✅ Nothing flagged — no slot is above the 35% threshold.')
      return
    }
    setLog([])
    setPass({ queue, i: 0 })
  }

  function applyAction(s: Slot, k: SlotActionKey) {
    const key = slotActionKey(s.pid, s.day, k)
    if (applied.slots.has(key)) return
    applyRebooking([key])
    toast(
      k === 'protect'
        ? '🪑 Chair protected — the room is held for a higher-need patient.'
        : k === 'smsLadder'
          ? '📲 SMS ladder queued — T-72h, T-24h, T-2h.'
          : '🧮 Slot overbooked against expected no-show.',
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ------------------------------------------------------------ intro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📅 No-show model + smart rebooking</CardTitle>
          <CardAction>
            <Badge variant="warning">Rank 13 · brief areas 2, 5</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The next 14 days of slots, scored per appointment.{' '}
            <b className="text-card-foreground">
              These probabilities read the same risk features as the care-team dashboard
            </b>{' '}
            — apply "Arrange rides (NEMT)" there and watch them fall here.
          </p>

          {/*
            The impact row. `Stat` (Field.tsx) reads label-above-value in small
            type; the legacy's impact tile is the inverse — a 2xl figure with the
            description beneath it — so this matches the app's impact-tile idiom
            (TeamScreen's `text-2xl font-bold text-link` on a card) rather than
            the Stat DOM order. The grid is responsive on purpose: the legacy
            pinned it to `repeat(4,1fr)` inline, which crushed four tiles onto
            one row on a phone.
          */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                [plan.protect.length, 'slots above 35% risk'],
                [plan.nudge.length, 'need an SMS ladder'],
                [plan.chairs, 'infusion chairs protected'],
                [plan.avoided.toFixed(1), 'expected no-shows avoided'],
              ] as const
            ).map(([n, d]) => (
              <Card key={d} className="gap-0 p-5">
                <div className="text-2xl font-bold text-link">{n}</div>
                <div className="mt-1 text-xs text-muted-foreground">{d}</div>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" size="xs" onClick={runPass} className="font-bold">
              ▶ Run rebooking pass
            </Button>
            <span className="text-xs text-muted-foreground">
              Protects the six highest-risk slots and queues their reminder ladders.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* --------------------------------------------- board + slot detail */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>14-day slot board</CardTitle>
            <Badge variant="neutral">click a day for detail</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              {TEAM_PATIENTS.map((p) => {
                const mine = rowsByPatient.get(p.id) ?? []
                const worst = mine.reduce((m, r) => Math.max(m, r.p), 0)
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 border-b border-border py-1 last:border-b-0"
                  >
                    <div className="flex w-40 flex-none items-center gap-1.5">
                      <b className="min-w-0 truncate text-xs font-semibold text-card-foreground">
                        {p.name}
                      </b>
                      <Badge variant={BAND_BADGE[slotBand(worst)]}>
                        {Math.round(worst * 100)}%
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {mine.map((r) => {
                        const selected = slotDay === r.s.day
                        const label = `${p.name} · day ${r.s.day} ${r.s.time} · ${r.s.res} — ${Math.round(
                          r.p * 100,
                        )}% no-show risk`
                        /*
                         * Deliberately a raw `<button>`, not the `Button`
                         * primitive: the day cell is a fixed `size-7` board
                         * square painted by `BAND_CELL` (border + tint + solid
                         * coral at the top band) and is a data mark, not a
                         * button-shaped control. `Button`'s own hover colours
                         * would fight the band palette — mint text on the solid
                         * coral measures 2.5:1 — so the primitive cannot be
                         * adopted here without overriding it back out again.
                         */
                        return (
                          <button
                            key={slotKey(r.s.pid, r.s.day)}
                            type="button"
                            aria-pressed={selected}
                            aria-label={label}
                            title={label}
                            onClick={() => setSlotDay(selected ? 0 : r.s.day)}
                            className={cn(
                              'flex size-7 items-center justify-center rounded-md border text-xs font-bold transition-transform hover:-translate-y-px',
                              BAND_CELL[slotBand(r.p)],
                              selected && 'ring-2 ring-brand-700',
                              r.actions.length > 0 && 'opacity-45',
                            )}
                          >
                            {r.s.day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              ref={logRef}
              className="mt-3 max-h-[140px] overflow-y-auto rounded-md bg-brand-900 p-3 font-mono text-xs text-on-dark-muted"
            >
              {log.length === 0 ? (
                <span>Rebooking log — run the pass to watch the flagged slots get protected.</span>
              ) : (
                log.map((l, i) => <div key={i}>{l}</div>)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {slotDay >= 1 ? `Day ${slotDay} — what is driving each slot` : 'Slot detail'}
            </CardTitle>
            <Badge variant="neutral">{slotDay >= 1 ? `${dayRows.length} slots` : 'pick a day'}</Badge>
          </CardHeader>
          <CardContent>
            {slotDay < 1 ? (
              <p className="text-sm text-muted-foreground">
                Pick a day on the board to see what is driving that slot's risk.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {dayRows.map((r) => (
                  <SlotDayCard key={slotKey(r.s.pid, r.s.day)} row={r} onAction={applyAction} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * One appointment on the selected day: the risk, what is driving it, and the
 * three things the clinic can do about it.
 *
 * Actions are one-way — the clinic store only ever adds to `slotApplied`, which
 * is what a rebooking pass is. An action already taken renders as "✓ Applied".
 */
function SlotDayCard({
  row,
  onAction,
}: {
  row: RebookRow
  onAction: (s: Slot, k: SlotActionKey) => void
}) {
  const s = row.s
  const p = slotPatient(s)
  const taken = (k: SlotActionKey) => row.actions.includes(k)

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <b className="text-sm font-semibold text-card-foreground">
            {p ? p.name : '—'} · Day {s.day} · {s.time}
          </b>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {s.res} · {s.dur} min · {s.leadDays} days out
          </div>
        </div>
        <Badge variant={BAND_BADGE[slotBand(row.p)]}>
          {Math.round(row.p * 100)}% no-show risk
        </Badge>
      </div>

      {row.why.length ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <b className="text-xs text-card-foreground">What is driving it:</b>
          {row.why.map((w) => (
            <Badge key={w} variant="neutral">
              {w}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          No risk drivers — this slot looks solid.
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {SLOT_ACTION_KEYS.map((k) => (
          <Button
            key={k}
            type="button"
            size="xs"
            variant="outline"
            aria-pressed={taken(k)}
            title={SLOT_ACTIONS[k].desc}
            onClick={() => onAction(s, k)}
            className={cn(
              'font-bold',
              taken(k) && 'border-brand-600 bg-brand-50 text-link hover:bg-brand-50 hover:text-link',
            )}
          >
            {taken(k) ? '✓ ' : ''}
            {SLOT_ACTIONS[k].label}
          </Button>
        ))}
      </div>

      {taken('smsLadder') && (
        <div className="mt-2 max-h-[96px] overflow-y-auto rounded-md bg-brand-900 p-3 font-mono text-xs text-on-dark-muted">
          {(
            [
              ['T-72h', 'Confirm your infusion — reply 1 to keep, 2 to move'],
              ['T-24h', `Reminder: tomorrow ${s.time} · ${s.res} · reply C to confirm`],
              ['T-2h', 'Leaving soon? Reply HELP if you need a ride'],
            ] as const
          ).map(([t, msg]) => (
            <div key={t}>
              <span className="text-on-dark">{t}</span> &nbsp;{msg}
            </div>
          ))}
        </div>
      )}

      {taken('overbook') && (
        <div className="mt-2 flex items-center gap-3 rounded-md border border-border p-3">
          <span
            aria-hidden="true"
            className="flex size-9 flex-none items-center justify-center rounded-md bg-brand-50 text-base"
          >
            🪑
          </span>
          <div className="min-w-0">
            <b className="block text-sm text-card-foreground">{WAITLIST[0].name}</b>
            <p className="text-xs text-muted-foreground">{WAITLIST[0].need}</p>
          </div>
          <span className="ml-auto flex-none text-xs font-bold text-link">seated</span>
        </div>
      )}
    </div>
  )
}
