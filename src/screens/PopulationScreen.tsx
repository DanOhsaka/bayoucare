import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { DataTable } from '@/components/motion/table'
import { ProgressTrack } from '@/components/shared/ProgressTrack'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CENTROIDS,
  MAP,
  METRICS,
  PARISH_DATA,
  bucketOf,
  followAction,
  outreachAction,
  parishResults,
  sideAction,
  type MetricKey,
  type ParishRow,
} from '@/engine/population/parishes'
import { useInterval } from '@/hooks/useInterval'
import { cn } from '@/lib/utils'

/** Quintile ramp. Index 0 is the suppressed bucket — a neutral tile, never a
 *  fabricated colour for a parish whose late-stage data the LTR rules withheld.
 *  A single sequential ramp, so it is not a `Badge` variant set. */
const SCALE = [
  'bg-muted text-muted-foreground',
  'bg-brand-50 text-on-brand-tint',
  'bg-brand-100 text-on-brand-tint',
  'bg-warning-bg text-warning-fg',
  'bg-warning text-on-warning',
  'bg-danger text-on-danger',
]

const METRIC_KEYS: MetricKey[] = ['need', 'late', 'inc', 'cov']

/** Zoom limits for the geographic map. 1× is the fitted view, and the pan clamp
 *  below collapses to zero translation there — so the map cannot be dragged
 *  until it has been zoomed in, and cannot be zoomed out past its own frame. */
const ZOOM_MIN = 1
const ZOOM_MAX = 4
const ZOOM_STEP = 1.5

/** How far a pointer must travel, in SCREEN pixels, before the gesture counts
 *  as a pan rather than a click. Small enough that a deliberate drag always
 *  registers; large enough that the wobble in a normal click does not. */
const DRAG_SLOP = 4

/** How far one arrow-key press pans, in VIEWBOX units — the same units as the
 *  transform, so a press moves the same slice of the map whatever the rendered
 *  width. Deliberately a stride rather than a nudge: zoomed right in the
 *  visible window is only ~129 units wide, and 48 crosses about a third of it,
 *  so the state is reachable in a handful of presses instead of dozens. */
const KEY_PAN_STEP = 48

/**
 * Hold a view inside its legal range: the scale within `ZOOM_MIN..ZOOM_MAX`, and
 * each translation within `[dimension * (1 - scale), 0]`.
 *
 * That translation range is the whole anti-lost-map guard. At scale `k` the map
 * occupies `[x, x + k · dimension]`, so pinning `x ≤ 0` keeps the left/top edge
 * at or past the frame and `x ≥ dimension · (1 - k)` keeps the right/bottom edge
 * at or past it. Both bounds meet at `0` when `k` is 1, which is why the fitted
 * view is immovable.
 */
function clampView(v: { k: number; x: number; y: number }) {
  const k = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.k))
  return {
    k,
    x: Math.min(0, Math.max(MAP.w * (1 - k), v.x)),
    y: Math.min(0, Math.max(MAP.h * (1 - k), v.y)),
  }
}

/**
 * The quintile ramp legend, rendered under BOTH map modes.
 *
 * One component rather than a copy per mode, so the cartogram and the geographic
 * map cannot drift apart. The end labels come from `METRICS[metric]` rather than
 * a hard-coded phrase: `worse` is what flips them, so the need index reads
 * "lower … higher" while Screening coverage correctly reads "higher … lower".
 * The caption is the only mode-dependent part, because "each tile is one parish"
 * and the numbered rank badges describe the cartogram and nothing else.
 */
function MapLegend({ metric, mode }: { metric: MetricKey; mode: 'tiles' | 'geo' }) {
  const m = METRICS[metric]

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          {m.worse ? 'lower' : 'higher'} {m.label.toLowerCase()}
        </span>
        {SCALE.map((c, i) => (
          <span key={i} className={cn('block size-3.5 rounded-sm', c)} aria-hidden="true" />
        ))}
        <span>
          {m.worse ? 'higher' : 'lower'} {m.label.toLowerCase()}
        </span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {mode === 'tiles'
          ? 'Tile cartogram — each tile is one parish; positions approximate geography. Numbered badges = top-10 unmet-need rank.'
          : 'Geographic map — real Census parish boundaries; hover or focus a parish for its numbers.'}{' '}
        <b className="text-card-foreground">
         Incidence &amp; late-stage: State Cancer Profiles / USCS. Screening coverage &amp;
          population: CDC PLACES 2025. {mode === 'tiles' ? 'Hatched tiles' : 'Muted parishes'} = late
          stage suppressed (&lt;16 cases).
        </b>
      </p>
    </>
  )
}

export function PopulationScreen() {
  const [metric, setMetric] = useState<MetricKey>('need')
  const [mode, setMode] = useState<'tiles' | 'geo'>('tiles')
  const [parish, setParish] = useState<string | null>(null)
  const [vanHere, setVanHere] = useState<string | null>(null)

  // The van tour, at the app root of this screen and cleaned up on unmount —
  // the legacy ran it un-cleared, so it kept advancing after you navigated away.
  const [tourStop, setTourStop] = useState<number | null>(null)
  const [tourLog, setTourLog] = useState<string[]>([])

  /**
   * The geographic map's hover/focus tooltip.
   *
   * Follows the cursor with the same edge clamping the legacy used — without it
   * the panel runs off the right edge on the last few columns of the state.
   */
  const [tip, setTip] = useState<{ name: string; x: number; y: number } | null>(null)
  const tipParish = tip ? PARISH_DATA.find((p) => p.n === tip.name) : null

  /**
   * Show the panel for `name` beside a viewport point, kept inside the window.
   *
   * The clamp lives HERE, at hover/focus time, not at render. Reading
   * `window.innerWidth` while rendering bakes in whatever the viewport happened
   * to be when the panel first appeared, so resizing left the panel stranded
   * past the edge until the pointer moved again. 275/210 are the legacy's own
   * margins — the `w-[262px]` panel plus its 14px offset from the pointer.
   */
  const showTip = (name: string, x: number, y: number) =>
   setTip({
      name,
      x: Math.max(8, Math.min(x + 14, window.innerWidth - 275)),
      y: Math.max(8, Math.min(y + 14, window.innerHeight - 210)),
    })

  /**
   * Zoom and pan, for the geographic map only.
   *
   * `k` is the scale and `x`/`y` the translation of the `<g>` that wraps the
   * parish paths — all three in VIEWBOX units, never screen pixels. Pointer
   * deltas arrive in screen pixels, so `startPan` converts them through the
   * rendered width; without that the map would pan at a different rate on a
   * 320px phone than on a 1440px desktop.
   */
  const [view, setView] = useState({ k: ZOOM_MIN, x: 0, y: 0 })

  /**
   * True once the gesture in progress has travelled far enough to be a pan.
   *
   * A pan still ends with a `click` on whatever parish it started on — the
   * browser does not know the pointer moved — so every path's `onClick` reads
   * this and ignores the click a drag would otherwise turn into a selection.
   * Cleared on the next pointerdown and never on pointerup, because `click`
   * arrives after pointerup.
   */
  const dragged = useRef(false)
  /** The pointer id of the pan in progress, or null. Guards against a second
   *  pointer starting a competing gesture mid-drag. */
  const panning = useRef<number | null>(null)

  /**
   * Zoom by `factor` about the centre of the viewBox.
   *
   * `x' = x + c · (k - k')` leaves the viewBox point `c` at the same place on
   * screen, so zooming in on the middle of the state does not slide it off the
   * edge; the clamp then trims whatever the zoom pushed past the frame.
   */
  const zoomTo = (factor: number) =>
   setView((v) => {
      const k = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.k * factor))
      return clampView({ k, x: v.x + (MAP.w / 2) * (v.k - k), y: v.y + (MAP.h / 2) * (v.k - k) })
    })

  const resetView = () => setView({ k: ZOOM_MIN, x: 0, y: 0 })

  /**
   * Drag to pan. Pointer Events, so one implementation covers mouse, touch and
   * pen; `touch-action` on the svg (below) stops a touch drag from scrolling
   * the page instead.
   *
   * The move/end listeners go on `window`, not on the svg, so a drag that
   * wanders off the map keeps panning. Pointer capture is deliberately NOT used:
   * capture retargets the follow-up `click` to the capturing element, which
   * would stop an ordinary click on a parish from ever reaching its path.
   */
  const startPan = (e: React.PointerEvent<SVGSVGElement>) => {
    // A second finger during a pan is ignored outright, and deliberately before
    // the flag is touched: clearing it here would let the gesture already in
    // progress end on a `click` that selects whatever parish it was over.
    if (panning.current != null) return
    // Cleared on every pointerdown that could start a gesture, including one at
    // 1× that cannot pan — a flag left set by an earlier drag would otherwise
    // swallow the next honest click.
    dragged.current = false
    if (view.k <= ZOOM_MIN) return

    const svg = e.currentTarget
    const id = e.pointerId
    const sx = e.clientX
    const sy = e.clientY
    const from = view
    panning.current = id

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      if (!dragged.current) {
        if (Math.hypot(dx, dy) <= DRAG_SLOP) return
        dragged.current = true
      }
      // Screen pixels -> viewBox units. The svg is `w-full` capped at 560px and
      // keeps its aspect ratio, so this one ratio serves both axes.
      const s = MAP.w / svg.getBoundingClientRect().width
      setView((v) => clampView({ ...v, x: from.x + dx * s, y: from.y + dy * s }))
    }

    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return
      panning.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
  }

  /**
   * Keyboard pan and zoom, for the map's wrapper — the surface that carries the
   * tab stop.
   *
   * The `e.target !== e.currentTarget` guard is load-bearing. Keydown on one of
   * the 64 focused parish paths bubbles through here, and panning then would
   * bolt a second behaviour onto a control that only ever advertised Enter and
   * Space — and would take the arrow keys away from the page while a parish is
   * focused. The surface pans; the paths do not.
   *
   * Only the keys it actually handles are `preventDefault`ed. Tab is not, which
   * is what still lets focus leave the surface.
   */
  const onMapKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return

    let dx = 0
    let dy = 0
    if (e.key === 'ArrowLeft') dx = -KEY_PAN_STEP
    else if (e.key === 'ArrowRight') dx = KEY_PAN_STEP
    else if (e.key === 'ArrowUp') dy = -KEY_PAN_STEP
    else if (e.key === 'ArrowDown') dy = KEY_PAN_STEP

    if (dx !== 0 || dy !== 0) {
      e.preventDefault()
      // The same `clampView` the drag goes through, so a run of presses stops
      // exactly where a drag would. At 1× that clamp collapses to the single
      // point 0, so each of these is a no-op rather than a move.
      setView((v) => clampView({ ...v, x: v.x + dx, y: v.y + dy }))
      return
    }

    // `+`/`=` and `-`/`_` are the shifted and unshifted halves of one key each,
    // so the zoom works whether or not Shift is held. `zoomTo` is the buttons'
    // own function — same factor, same clamp — which is why `+` at 4× idles.
    if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      zoomTo(ZOOM_STEP)
      return
    }
    if (e.key === '-' || e.key === '_') {
      e.preventDefault()
      zoomTo(1 / ZOOM_STEP)
    }
  }

  const stops = useMemo(() => PARISH_DATA.filter((p) => p.rank != null).slice(0, 10), [])

  useInterval(
    () => {
      if (tourStop == null) return
      if (tourStop >= stops.length) {
        setTourStop(null)
        toast('Van tour complete — 10 parishes routed by unmet need.')
        return
      }
      const p = stops[tourStop]
      setVanHere(p.n)
      setParish(p.n)
      setTourLog((l) => [
        ...l,
        `Stop ${tourStop + 1}/10 — ${p.n} — ${p.late}% late-stage · ${p.uns.toLocaleString()} unscreened · rank #${p.rank}`,
      ])
      setTourStop(tourStop + 1)
    },
    tourStop != null ? 900 : null,
  )

  const m = METRICS[metric]
  const selected = parish ? (PARISH_DATA.find((p) => p.n === parish) ?? null) : null
  const top8 = PARISH_DATA.filter((p) => p.rank != null).slice(0, 8)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Parish heat index — where screening matters most
          </CardTitle>
          <Badge variant="success" className="text-left whitespace-normal">
           All 64 parishes · State Cancer Profiles + CDC PLACES
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
           All 64 parishes scored on incidence, late-stage share, coverage, and unmet need — so
            screening vans and SMS nudges go to the{' '}
            <b className="text-card-foreground">highest-burden parishes, not just the biggest cities</b>.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Louisiana, by the numbers</CardTitle>
          <CardAction>
            {METRIC_KEYS.map((k) => (
              <Button
                key={k}
                type="button"
                size="xs"
                variant={metric === k ? 'default' : 'outline'}
                aria-pressed={metric === k}
                onClick={() =>setMetric(k)}
                className="rounded-full px-2.5 font-bold"
              >
                {METRICS[k].label}
              </Button>
            ))}
          </CardAction>
        </CardHeader>

        <CardContent>
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0">
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="xs"
                  variant={mode === 'tiles' ? 'default' : 'outline'}
                  aria-pressed={mode === 'tiles'}
                  onClick={() =>setMode('tiles')}
                  className="rounded-full px-2.5 font-bold"
                >
                  Tile cartogram
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant={mode === 'geo' ? 'default' : 'outline'}
                  aria-pressed={mode === 'geo'}
                  onClick={() =>setMode('geo')}
                  className="rounded-full px-2.5 font-bold"
                >
                  Geographic map
                </Button>
              </div>

              {mode === 'tiles' ? (
                /*
                 * `grid-cols-12` compiles to `repeat(12, minmax(0, 1fr))`, so the
                 * columns always shrink and never overflow — which made the
                 * `overflow-x-auto` wrapper decorative, with nothing to scroll.
                 * At 320px that crushed twelve columns into ~18px tiles against
                 * `h-8` boxes. The floor gives the wrapper something to scroll;
                 * the tile x/y positions are inline (below) and would create
                 * implicit columns at any other `grid-cols-N`, so re-authoring
                 * the positions per breakpoint is the alternative this avoids.
                 *
                 * 560 was a 44.83px tile — over the 44px floor by less than the
                 * pixel a thumb cannot use anyway. 598 is the narrowest grid on
                 * which a tile measures the 48px the touch pass asks for, and it
                 * is exact rather than rounded up: twelve 48px tiles (576) plus
                 * the eleven 2px `gap-0.5` gutters between them (22). 576/12 has
                 * no remainder, so the browser's fractional-pixel distribution
                 * never comes into it — every column is 48.00, measured.
                 */
                <div className="max-w-[760px] overflow-x-auto">
                  <div className="grid min-w-[598px] grid-cols-12 gap-0.5">
                    {PARISH_DATA.map((p) => {
                      const b = bucketOf(p, metric)
                      const v = m.f(p)
                      const valTxt = v == null ? 'suppressed (<16 cases)' : m.fmt(v)
                      const rankTxt = m.worse && p.rank != null ? ` · unmet-need rank #${p.rank}` : ''
                      /*
                       * Deliberately a raw `<button>`, not the `Button`
                       * primitive: a cartogram tile is a grid cell positioned by
                       * inline `grid-column`/`grid-row`, sized by the grid, and
                       * shaped by the quintile ramp — none of which the
                       * button-shaped primitive (fixed height, `shrink-0`,
                       * rounded-md) can express without being overridden away.
                       *
                       * It is a toggle all the same, so it carries the touch
                       * floor: `h-11` below `lg`, the designed `h-8` above. Only
                       * the height moves — the grid's `min-w-[598px]` already
                       * guarantees 48px of width — and the inline
                       * `grid-column`/`grid-row` positions are untouched, so the
                       * cartogram keeps its shape and simply gets a taller row.
                       */
                      return (
                        <button
                          key={p.n}
                          type="button"
                          aria-pressed={parish === p.n}
                          /*
                           * The visible label is the 3-letter abbreviation, and
                           * `title` is only a last-resort source for the
                           * accessible name once an element has content — so
                           * without this a screen reader tabs through 64
                           * anonymous codes ("CAD", "BOS") carrying no parish and
                           * no value. The name carries what the tooltip shows.
                           */
                          aria-label={`${p.n} — ${valTxt}${rankTxt}`}
                          title={`${p.n} — ${valTxt}${rankTxt}`}
                          onClick={() => setParish(p.n)}
                          style={{ gridColumn: p.x, gridRow: p.y }}
                          className={cn(
                            'relative flex h-11 items-center justify-center rounded-sm text-xs font-bold transition-transform hover:scale-110 lg:h-8',
                            SCALE[b],
                            parish === p.n && 'ring-2 ring-brand-700',
                            vanHere === p.n && 'ring-2 ring-warning',
                          )}
                        >
                          {p.rank != null && p.rank <= 10 && (
                            <span
                              aria-hidden="true"
                              className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-brand-700 text-xs text-on-dark"
                            >
                              {p.rank}
                            </span>
                          )}
                          <span aria-hidden="true">{p.ab}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                /* The map's keyboard surface — the tab stop lives HERE, on the
                 * wrapper, and not on the svg inside it. Two reasons, both
                 * load-bearing:
                 *
                 *  - Ordering. This is one extra stop, immediately BEFORE the
                 *    64 parish paths: reach the map, pan it, then walk into the
                 *    parishes. Do not move it below the paths, and do not add a
                 *    second one.
                 *
                 *  - The ring. This div is a scroll container, and a scroll
                 *    container clips its DESCENDANTS to its padding box. The
                 *    svg fills it edge to edge on the left, right and bottom,
                 *    so an outline on the svg lost those three sides — the
                 *    whole point of a focus ring, gone. An element's own
                 *    outline is never clipped by its own `overflow`, so on the
                 *    div the ring survives intact.
                 *
                 * The label states the keys, because a focusable group whose
                 * name only describes its contents leaves a keyboard user to
                 * discover the bindings by pressing things.
                 */
                <div
                  className="overflow-x-auto"
                  role="group"
                  aria-label="Louisiana parish map. Arrow keys pan when zoomed in; plus and minus zoom."
                  tabIndex={0}
                  onKeyDown={onMapKeyDown}
                >
                  {/*
                    * Zoom controls. Real buttons rather than gestures alone, so
                    * the map has a keyboard path and a discoverable one; they sit
                    * ABOVE the svg rather than floating over it, where they would
                    * cover the north of the state at every size. `flex-wrap` is
                    * load-bearing: this screen has overflowed at 320px before,
                    * and a row of controls is exactly the kind of thing that
                    * does it.
                    */}
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {/*
                      * 44px at the base size, back to the primitive's own 32px
                      * from `lg` up. 32 is a fine mouse target and a bad thumb
                      * one, and `size="icon-sm"` is 32 by definition — so the
                      * override is per-call rather than a change to `Button`,
                      * which every other screen also uses. `lg` rather than
                      * `sm`/`md` on purpose: tablets are touch screens too, and
                      * `lg` is the same breakpoint at which this card stops
                      * stacking and goes two-column.
                      */}
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      aria-label="Zoom in"
                      disabled={view.k >= ZOOM_MAX}
                      onClick={() => zoomTo(ZOOM_STEP)}
                      className="size-11 lg:size-8"
                    >
                      +
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      aria-label="Zoom out"
                      disabled={view.k <= ZOOM_MIN}
                      onClick={() =>zoomTo(1 / ZOOM_STEP)}
                      className="size-11 lg:size-8"
                    >
                      −
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label="Reset zoom and pan"
                      disabled={view.k <= ZOOM_MIN}
                      onClick={resetView}
                      className="h-11 lg:h-8"
                    >
                     Reset
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {view.k > ZOOM_MIN ? 'Drag the map to pan.' : 'Zoom in to pan.'}
                    </span>
                  </div>
                  {/*
                    * `role="img"` makes this a LEAF in the accessibility tree, and
                    * screen readers prune a leaf's descendants — which silently
                    * removed all 64 focusable parish buttons below from AT, even
                    * though each one is a correctly-built `role="button"` with a
                    * label and Enter/Space handling. `group` keeps the graphic's
                    * name while leaving its children exposed. The radar uses the
                    * same role for the same reason.
                    */}
                  {/*
                    * `onPointerDown` is the pan gesture, and `touch-action` is
                    * what makes it work on a touchscreen: without it the browser
                    * claims the drag for page scrolling and the map never moves.
                    * It is set only while zoomed in — at 1× there is nothing to
                    * pan, so a swipe over the map scrolls the page exactly as it
                    * does everywhere else, and the control cannot become a
                    * scroll trap in its default state. The reset button above
                    * restores that at any time. `select-none` stops the drag
                    * from painting a text selection across the page.
                    */}
                  <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} className="h-auto w-full max-w-[560px] select-none" role="group" aria-label="Louisiana parishes by screening need" onPointerDown={startPan} style={{ touchAction: view.k > ZOOM_MIN ? 'none' : undefined }}>
                    {/*
                      * `aria-label` above is the accessible name; a <title> here
                      * would be a second, conflicting one.
                      */}
                    {/*
                      * Every parish path and the van marker sit inside this one
                      * `<g>`, so a single transform pans and zooms the whole
                      * map. Its values are VIEWBOX units, which is what makes
                      * the pan rate independent of the rendered size. The root
                      * svg clips to its viewport by default — nothing between it
                      * and here sets `overflow: visible` — so whatever the
                      * transform pushes past the frame is cut off at the edge
                      * rather than drawn over the page.
                      */}
                    <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
                    {Object.entries(MAP.d).map(([name, d]) => {
                      const p = PARISH_DATA.find((x) => x.n === name)
                      const b = p ? bucketOf(p, metric) : 0
                      /*
                       * The path's label carries the value, exactly as the
                       * cartogram tile's already does — "Webster Parish" on its
                       * own left a screen-reader user with a name and no number
                       * while the tooltip showed both. Computed for the CURRENT
                       * metric, so switching to Late-stage % relabels all 64
                       * paths. A name missing from PARISH_DATA falls back to the
                       * bare parish name rather than claiming "suppressed".
                       */
                      const v = p ? m.f(p) : null
                      const valTxt = v == null ? 'suppressed (<16 cases)' : m.fmt(v)
                      const rankTxt =
                        p && m.worse && p.rank != null ? ` · unmet-need rank #${p.rank}` : ''
                      const label = p ? `${name} — ${valTxt}${rankTxt}` : name
                      const fill =
                        b === 0
                          ? 'var(--muted)'
                          : b >= 5
                            ? 'var(--coral-500)'
                            : b === 4
                              ? 'var(--amber-500)'
                              : b === 3
                                ? 'var(--green-100)'
                                : b === 2
                                  ? 'var(--green-50)'
                                  : 'var(--soft)'
                      // Each path is a real control, so the map is usable without a
                      // mouse — the legacy attached click handlers to bare <path>s.
                      return (
                        <path
                          key={name}
                          d={d}
                          fill={fill}
                          stroke="var(--line)"
                          strokeWidth={0.6}
                          role="button"
                          tabIndex={0}
                          aria-label={label}
                          aria-pressed={parish === name}
                          // Hover feedback the legacy had and I had missed: the
                          // stroke darkens and thickens under the cursor, so the
                          // map reads as interactive before you click anything.
                          className={cn(
                            'cursor-pointer outline-offset-2 transition-[opacity,stroke,stroke-width] duration-100',
                            'hover:stroke-brand-900 hover:opacity-90 hover:[stroke-width:1.4]',
                            parish === name && 'stroke-brand-900 [stroke-width:1.8]',
                          )}
                          /*
                           * A drag that started on this parish ends on it too —
                           * the browser fires `click` at the element the gesture
                           * began on, however far the pointer travelled — so a
                           * pan would otherwise select whatever parish you
                           * happened to grab. `dragged` is the gesture's own
                           * record of having moved, still set at this point
                           * because `click` lands after pointerup.
                           */
                          onClick={() => {
                            if (dragged.current) return
                            setParish(name)
                          }}
                          onMouseMove={(e) => showTip(name, e.clientX, e.clientY)}
                          onMouseLeave={() => setTip(null)}
                          /*
                           * Keyboard parity for the panel below: a focused path has
                           * no cursor to follow, so anchor the panel to the path's
                           * own box instead. Without this a sighted keyboard user
                           * could select a parish and still never see the numbers
                           * the mouse gets.
                           */
                          onFocus={(e) => {
                            const r = e.currentTarget.getBoundingClientRect()
                            showTip(name, r.left + r.width / 2, r.bottom)
                          }}
                          onBlur={() => setTip(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setParish(name)
                            }
                          }}
                        />
                      )
                    })}
                    {vanHere && CENTROIDS[vanHere] && (
                      <circle
                        cx={CENTROIDS[vanHere][0]}
                        cy={CENTROIDS[vanHere][1]}
                        r={6}
                        fill="var(--green-500)"
                        stroke="var(--card)"
                        strokeWidth={2}
                      />
                    )}
                    </g>
                  </svg>
                </div>
              )}

              {/* One legend for both modes — see `MapLegend` above. */}
              <MapLegend metric={metric} mode={mode} />
            </div>

            {/* ------------------------------------------------ side panel */}
            <Card>
              <CardHeader>
                <CardTitle>{selected ? `${selected.n} Parish` : '—'}</CardTitle>
                <Badge
                  variant={selected?.rank != null && selected.rank <= 10 ? 'danger' : 'neutral'}
                  className="text-left whitespace-normal"
                >
                  {selected
                    ? selected.rank != null
                      ? `#${selected.rank} of ${PARISH_DATA.filter((x) => x.rank != null).length} ranked by unmet need`
                      : 'Not ranked — late-stage data suppressed'
                    : 'pick a parish'}
                </Badge>
              </CardHeader>

              <CardContent>
                {selected && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      ['Population', selected.pop.toLocaleString()],
                      ['Incidence /100k', String(selected.inc)],
                      ['Late-stage share', selected.late == null ? 'suppressed' : `${selected.late}%`],
                      ['Screening coverage', `${selected.cov}%`],
                      ['Eligible & unscreened', `≈ ${selected.uns.toLocaleString()}`],
                      ['30-day action', sideAction(selected)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <span className="block text-xs text-muted-foreground">{k}</span>
                        <span className="block font-bold text-card-foreground">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3.5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="xs"
                    className="font-bold"
                    onClick={() =>{
                      if (!selected) return toast('Pick a parish on the map first.')
                      setVanHere(selected.n)
                      toast(`Van routed to ${selected.n} — mobile screening unit arrives Saturday.`)
                    }}
                  >
                    Route van here
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    className="font-bold"
                    onClick={() =>{
                      if (!selected) return toast('Pick a parish on the map first.')
                      toast(
                        ` ${selected.uns.toLocaleString()} un-screened adults queued for SMS nudges (event invites + LA Quitline) in ${selected.n}.`,
                      )
                    }}
                  >
                    SMS nudge cohort
                  </Button>
                </div>

                <div className="mt-3 max-h-[140px] overflow-y-auto rounded-md bg-brand-900 p-3 font-mono text-xs leading-relaxed text-on-dark">
                  {tourLog.length === 0 ? (
                    <span className="text-on-dark-muted">
                     Van tour log — deploy to the top-10 parishes to watch routing live.
                    </span>
                  ) : (
                    tourLog.map((l, i) => <div key={i}>{l}</div>)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------ outreach queue */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Risk-stratified outreach queue</CardTitle>
          <Badge variant="warning" className="text-left whitespace-normal">
           screening vans · SMS · CHW visits — top 8 parishes by unmet need
          </Badge>
          <CardAction>
            <Button
              type="button"
              size="xs"
              className="font-bold"
              onClick={() =>{
                if (tourStop != null) {
                  setTourStop(null)
                  toast('Van tour stopped.')
                } else {
                  setTourLog([])
                  setTourStop(0)
                }
              }}
            >
              {tourStop != null ? 'Stop tour' : 'Deploy van to top-10'}
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <DataTable
            data={top8}
            getRowId={(p) => p.n}
            height={420}
            rowHeight={64}
            defaultSort={{ key: 'uns', direction: 'desc' }}
            columns={[
              {
                key: 'n',
                header: 'Parish',
                sortable: true,
                truncate: false,
                title: (p) => `${p.rank}. ${p.n} Parish`,
                cell: (p) => (
                  <>
                    <b className="text-card-foreground">
                      {p.rank}. {p.n} Parish
                    </b>
                    <div className="text-xs text-muted-foreground">
                      {p.late == null ? 'late-stage suppressed' : `${p.late}% late-stage`} ·{' '}
                      {p.cov}% screened
                    </div>
                  </>
                ),
              },
              {
                key: 'uns',
                header: 'Unscreened',
                sortable: true,
                truncate: false,
                sortValue: (p) => p.uns,
                cell: (p) => (
                  <>
                    <span className="block text-xs text-muted-foreground">Unscreened</span>
                    <b className="text-card-foreground">{p.uns.toLocaleString()}</b>
                  </>
                ),
              },
              {
                key: 'cov',
                header: 'Coverage gap',
                sortable: true,
                truncate: false,
                sortValue: (p) => 100 - p.cov,
                cell: (p) => (
                  <>
                    <span className="block text-xs text-muted-foreground">Coverage gap</span>
                    <b className="text-card-foreground">{(100 - p.cov).toFixed(0)}%</b>
                  </>
                ),
              },
              {
                key: 'action',
                header: 'Outreach',
                align: 'right',
                truncate: false,
                title: (p) => outreachAction(p).label,
                cell: (p) => {
                  const a = outreachAction(p)
                  return <Badge variant={a.tone}>{a.label}</Badge>
                },
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* ------------------------------------------- follow-up + FIT kits */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <FollowQueue selected={selected} />
        <FitTracking selected={selected} />
      </div>

      {/*
        The geographic map's hover/focus panel.
        Fixed-position rather than absolute so it follows the cursor and is never
        clipped by the map's scroll container. `pointer-events-none` matters: the
        node sits under the cursor, and without it the tooltip would steal the
        mouseleave from the path beneath and flicker. `left`/`top` arrive already
        clamped against the live viewport — `showTip` clamps when the panel is
        opened, so these are final and a later resize cannot strand it off-screen.
      */}
      {tip && tipParish && (
        /* Deliberately not `Card`: this is the map's cursor-following overlay,
           whose `w-[262px]`, `p-3` and `--shadow-lg` are not the panel idiom. */
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 w-[262px] rounded-lg border border-border bg-card p-3 text-xs shadow-[var(--shadow-lg)]"
          style={{ left: tip.x, top: tip.y }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-sm text-card-foreground">{tipParish.n} Parish</b>
            <Badge variant={tipParish.rank != null && tipParish.rank <= 10 ? 'danger' : 'neutral'}>
              {tipParish.rank == null ? 'late-stage data suppressed' : `#${tipParish.rank} unmet need`}
            </Badge>
          </div>

          <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
            {(
              [
                ['Population', tipParish.pop.toLocaleString()],
                ['Incidence /100k', String(tipParish.inc)],
                ['Late-stage share', tipParish.late == null ? 'suppressed' : `${tipParish.late}%`],
                ['Screening coverage', `${tipParish.cov}%`],
                ['Eligible & unscreened', `≈ ${tipParish.uns.toLocaleString()}`],
                ['Need index', tipParish.need == null ? '—' : tipParish.need.toFixed(1)],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-bold text-card-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

function FollowQueue({ selected }: { selected: ParishRow | null }) {
  const top8 = PARISH_DATA.filter((p) => p.rank != null).slice(0, 8)
  const scope = selected ? [selected] : top8
  const totals = scope.reduce(
    (acc, p) => {
      const f = parishResults(p)
      acc.abnormal += f.abnormal
      acc.overdue += f.overdue
      return acc
    },
    { abnormal: 0, overdue: 0 },
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>14-day abnormal-result follow-up queue</CardTitle>
        <Badge variant="warning">Rank 4 extension · brief area 4</Badge>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-card-foreground">
          {selected
            ? `Scoped to ${selected.n} Parish — ${totals.abnormal} abnormal results in the window.`
            : `Top 8 parishes — ${totals.abnormal} abnormal results, ${totals.overdue} past the 14-day window.`}
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {scope.map((p) => {
            const f = parishResults(p)
            const a = followAction(f)
            return (
              <div key={p.n} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-card-foreground">{p.n}</b>
                  <div className="text-xs text-muted-foreground">
                    {f.abnormal} abnormal · {f.overdue} overdue · {f.lag}-day lag
                  </div>
                </div>
                <Badge variant={a.tone}>{a.label}</Badge>
              </div>
            )
          })}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
         Screening only helps if an abnormal result actually gets followed up. This queue comes from
          the same parish need model — pick any parish on the map or the tiles to re-scope it.
        </p>
      </CardContent>
    </Card>
  )
}

function FitTracking({ selected }: { selected: ParishRow | null }) {
  const top8 = PARISH_DATA.filter((p) => p.rank != null).slice(0, 8)
  const scope = selected ? [selected] : top8

  return (
    <Card>
      <CardHeader>
        <CardTitle>FIT kit return tracking</CardTitle>
        <Badge variant="neutral">
         mailed stool kits · {selected ? selected.n : 'top 8 parishes'}
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          {scope.map((p) => {
            const f = parishResults(p)
            const pct = Math.round(f.fitRate * 100)
            return (
              <div key={p.n} className="flex items-center gap-3">
                <span className="w-28 flex-none truncate text-sm text-card-foreground">{p.n}</span>
                <ProgressTrack
                  pct={pct}
                  tone={pct < 40 ? 'danger' : pct < 55 ? 'warning' : 'brand'}
                  width="w-24"
                  valueText={`${f.fitBack.toLocaleString()}/${f.fitSent.toLocaleString()} · ${pct}%`}
                />
              </div>
            )
          })}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
         FIT kits need no appointment and no bowel prep — for a rural patient that is often the
          difference between screened and not. The return rate drives the escalation in the queue
          beside it.
        </p>
      </CardContent>
    </Card>
  )
}
