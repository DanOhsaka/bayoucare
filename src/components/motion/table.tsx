// beui-inspired virtualized data table — sticky header, sort, selection

import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { Checkbox } from '@/components/motion/checkbox'
import { cn } from '@/lib/utils'

export type SortDirection = 'asc' | 'desc'

export type SortState = {
  key: string
  direction: SortDirection
}

export type DataTableColumn<T> = {
  key: string
  header: ReactNode
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
  cell?: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  /** Explicit hover label. Defaults to the cell’s text when it truncates. */
  title?: (row: T) => string | undefined
  /** Ellipsis overflow. Default true. */
  truncate?: boolean
}

export type DataTableProps<T> = {
  data: T[]
  columns: DataTableColumn<T>[]
  getRowId?: (row: T, index: number) => string
  selectable?: boolean
  selectedRowIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  defaultSort?: SortState | null
  rowHeight?: number
  height?: number
  overscan?: number
  emptyState?: ReactNode
  className?: string
  /** Show “N rows” above the table. Default true. */
  showCount?: boolean
}

function readCell(row: object, key: string): ReactNode {
  const value = (row as Record<string, unknown>)[key]
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return null
}

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

/**
 * Shows the full label on hover when the cell content is ellipsized.
 */
function TruncatingCell({
  children,
  className,
  title: titleProp,
  truncate = true,
  style,
}: {
  children: ReactNode
  className?: string
  title?: string
  truncate?: boolean
  style?: CSSProperties
}) {
  const ref = useRef<HTMLTableCellElement>(null)
  const [overflowTitle, setOverflowTitle] = useState<string | undefined>()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !truncate) {
      setOverflowTitle(undefined)
      return
    }

    const update = () => {
      const truncated = el.scrollWidth > el.clientWidth + 1
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
      setOverflowTitle(truncated && text ? text : undefined)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [children, truncate])

  return (
    <td
      ref={ref}
      title={titleProp || overflowTitle}
      className={cn(truncate && 'truncate', className)}
      style={style}
    >
      {children}
    </td>
  )
}

/**
 * Virtualized data table — sticky header, sortable columns, optional selection.
 * Matches beUI table chrome for status/list surfaces across BayouCare.
 */
export function DataTable<T extends object>({
  data,
  columns,
  getRowId,
  selectable = false,
  selectedRowIds,
  onSelectionChange,
  defaultSort = null,
  rowHeight = 48,
  height = 360,
  overscan = 8,
  emptyState = 'No data',
  className,
  showCount = true,
}: DataTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [sort, setSort] = useState<SortState | null>(defaultSort)
  const [internalSelected, setInternalSelected] = useState<string[]>([])

  const selected = selectedRowIds ?? internalSelected
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const rows = useMemo(
    () =>
      data.map((row, index) => ({
        row,
        id: getRowId ? getRowId(row, index) : String(index),
      })),
    [data, getRowId],
  )

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((c) => c.key === sort.key)
    if (!column?.sortable) return rows
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const aRec = a.row as Record<string, unknown>
      const bRec = b.row as Record<string, unknown>
      const av =
        column.sortValue?.(a.row) ??
        (aRec[column.key] as string | number | undefined) ??
        ''
      const bv =
        column.sortValue?.(b.row) ??
        (bRec[column.key] as string | number | undefined) ??
        ''
      return compareValues(av as string | number, bv as string | number) * dir
    })
  }, [columns, rows, sort])

  const virtualizer = useVirtualizer({
    count: sortedRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()
  const paddingTop = virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0

  const allSelected = sortedRows.length > 0 && sortedRows.every((r) => selectedSet.has(r.id))
  const someSelected = sortedRows.some((r) => selectedSet.has(r.id)) && !allSelected

  function setSelected(next: string[]) {
    if (selectedRowIds === undefined) setInternalSelected(next)
    onSelectionChange?.(next)
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? sortedRows.map((r) => r.id) : [])
  }

  function toggleRow(id: string) {
    if (selectedSet.has(id)) setSelected(selected.filter((x) => x !== id))
    else setSelected([...selected, id])
  }

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }

  return (
    <div className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      {showCount ? (
        <p className="text-xs text-muted-foreground tabular-nums">
          {sortedRows.length.toLocaleString()} row{sortedRows.length === 1 ? '' : 's'}
        </p>
      ) : null}

      <div
        ref={scrollRef}
        className="relative overflow-auto rounded-xl border border-border bg-card"
        style={{
          maxHeight: height,
          height:
            sortedRows.length === 0
              ? undefined
              : Math.min(height, sortedRows.length * rowHeight + 42),
        }}
      >
        <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
          <thead className="sticky top-0 z-20 isolate border-b border-border bg-card">
            <tr>
              {selectable ? (
                <th className="w-12 bg-card px-3 py-2.5 text-left">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              ) : null}
              {columns.map((column) => {
                const active = sort?.key === column.key
                return (
                  <th
                    key={column.key}
                    style={column.width ? { width: column.width } : undefined}
                    className={cn(
                      'bg-card px-3 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                      column.align !== 'right' && column.align !== 'center' && 'text-left',
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex max-w-full items-center gap-1 rounded-md transition-colors hover:text-foreground"
                      >
                        <span className="truncate">{column.header}</span>
                        {active && sort?.direction === 'asc' ? (
                          <ArrowUp className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
                        ) : active && sort?.direction === 'desc' ? (
                          <ArrowDown className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
                        ) : (
                          <ArrowUpDown className="size-3.5 shrink-0 opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      <span className="truncate">{column.header}</span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyState}
                </td>
              </tr>
            ) : (
              <>
                {paddingTop > 0 ? (
                  <tr aria-hidden="true">
                    <td
                      colSpan={columns.length + (selectable ? 1 : 0)}
                      style={{ height: paddingTop, padding: 0, border: 0 }}
                    />
                  </tr>
                ) : null}
                {virtualItems.map((vItem) => {
                  const entry = sortedRows[vItem.index]
                  if (!entry) return null
                  const isSelected = selectedSet.has(entry.id)
                  return (
                    <tr
                      key={entry.id}
                      data-selected={isSelected}
                      className={cn(
                        'border-b border-border/60 transition-colors last:border-b-0',
                        'hover:bg-muted/40 data-[selected=true]:bg-muted/60',
                      )}
                      style={{ height: rowHeight }}
                    >
                      {selectable ? (
                        <td className="px-3 py-2 align-middle">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRow(entry.id)}
                            aria-label={`Select row ${vItem.index + 1}`}
                          />
                        </td>
                      ) : null}
                      {columns.map((column) => (
                        <TruncatingCell
                          key={column.key}
                          truncate={column.truncate !== false}
                          title={column.title?.(entry.row)}
                          className={cn(
                            'overflow-hidden px-3 py-2 align-middle text-card-foreground',
                            column.align === 'right' && 'text-right',
                            column.align === 'center' && 'text-center',
                          )}
                        >
                          {column.cell
                            ? column.cell(entry.row)
                            : readCell(entry.row, column.key)}
                        </TruncatingCell>
                      ))}
                    </tr>
                  )
                })}
                {paddingBottom > 0 ? (
                  <tr aria-hidden="true">
                    <td
                      colSpan={columns.length + (selectable ? 1 : 0)}
                      style={{ height: paddingBottom, padding: 0, border: 0 }}
                    />
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export { DataTable as Table }
