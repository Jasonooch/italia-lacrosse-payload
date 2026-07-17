'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Download,
  ListFilter,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import type { FormSubmission } from '@/payload-types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/dashboard/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/dashboard/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import { SubmissionQuickView } from '@/components/dashboard/submission-quick-view'
import {
  CHOICE_ANSWER_TYPES,
  formatSubmissionDate,
  getAnswerForColumn,
  type JotformSubmission,
  type SubmissionColumn,
} from '@/lib/jotform-display'

type SortDirection = 'asc' | 'desc'
type Sort = { key: string; direction: SortDirection }
type Operator = 'includes' | 'not_includes' | 'equals' | 'empty' | 'not_empty'
type DateRange = 'all' | 'today' | '7d' | '30d' | 'year'
type FilterRow = { id: string; field: string; operator: Operator; value: string }

const SUBMITTED_KEY = '__submitted'
const DAY_MS = 24 * 60 * 60 * 1000

const OPERATOR_LABELS: Record<Operator, string> = {
  includes: 'Includes',
  not_includes: 'Does not include',
  equals: 'Equals',
  empty: 'Is empty',
  not_empty: 'Is not empty',
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'submissions'
  )
}

function toCsvValue(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function matchesFilterRow(data: JotformSubmission, filterRow: FilterRow): boolean {
  if (!filterRow.field) return true
  const value = getAnswerForColumn(data, filterRow.field) || ''
  const needle = filterRow.value.trim().toLowerCase()
  switch (filterRow.operator) {
    case 'includes':
      return needle ? value.toLowerCase().includes(needle) : true
    case 'not_includes':
      return needle ? !value.toLowerCase().includes(needle) : true
    case 'equals':
      return needle ? value.toLowerCase() === needle : true
    case 'empty':
      return value.trim() === ''
    case 'not_empty':
      return value.trim() !== ''
  }
}

function matchesDateRange(rawDate: string, range: DateRange): boolean {
  if (range === 'all') return true
  if (!rawDate) return false
  const date = new Date(rawDate.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  if (range === 'today') return date.toDateString() === now.toDateString()
  if (range === '7d') return now.getTime() - date.getTime() <= 7 * DAY_MS
  if (range === '30d') return now.getTime() - date.getTime() <= 30 * DAY_MS
  if (range === 'year') return date.getFullYear() === now.getFullYear()
  return true
}

function SortableHeader({
  label,
  title,
  className,
  active,
  direction,
  onSort,
}: {
  label: string
  title?: string
  className?: string
  active: boolean
  direction: SortDirection | null
  onSort: (direction: SortDirection | null) => void
}) {
  return (
    <TableHead className={cn('group', className)}>
      <div className="flex items-center justify-between gap-1">
        <span className="truncate" title={title ?? label}>
          {label}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(event) => event.stopPropagation()}
              className={cn(
                'shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
              )}
              aria-label={`Sort by ${label}`}
            >
              {active && direction === 'asc' ? (
                <ArrowUp className="size-3.5" />
              ) : active && direction === 'desc' ? (
                <ArrowDown className="size-3.5" />
              ) : (
                <MoreVertical className="size-3.5" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onSort('asc')}>
              <ArrowUp className="size-4" />
              Sort ascending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort('desc')}>
              <ArrowDown className="size-4" />
              Sort descending
            </DropdownMenuItem>
            {active && <DropdownMenuItem onClick={() => onSort(null)}>Clear sort</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TableHead>
  )
}

function FilterRowEditor({
  row,
  columns,
  columnOptions,
  onChange,
  onRemove,
}: {
  row: FilterRow
  columns: SubmissionColumn[]
  columnOptions: Map<string, string[]>
  onChange: (row: FilterRow) => void
  onRemove: () => void
}) {
  const needsValue = row.operator === 'includes' || row.operator === 'not_includes' || row.operator === 'equals'
  const choiceOptions = columnOptions.get(row.field)

  return (
    <div className="flex items-center gap-2">
      <Select value={row.field} onValueChange={(field) => onChange({ ...row, field, value: '' })}>
        <SelectTrigger className="w-40 flex-1" size="sm">
          <SelectValue placeholder="Choose a field" />
        </SelectTrigger>
        <SelectContent>
          {columns.map((column) => (
            <SelectItem key={column.key} value={column.key}>
              {column.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={row.operator}
        onValueChange={(operator) => onChange({ ...row, operator: operator as Operator })}
      >
        <SelectTrigger className="w-40 shrink-0" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(OPERATOR_LABELS) as [Operator, string][]).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {needsValue ? (
        choiceOptions ? (
          <Select value={row.value} onValueChange={(value) => onChange({ ...row, value })}>
            <SelectTrigger className="h-8 flex-1" size="sm">
              <SelectValue placeholder="Choose a value" />
            </SelectTrigger>
            <SelectContent>
              {choiceOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={row.value}
            onChange={(event) => onChange({ ...row, value: event.target.value })}
            placeholder="Value"
            className="h-8 flex-1"
          />
        )
      ) : (
        <div className="h-8 flex-1 rounded-md border border-dashed" />
      )}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onRemove}
        aria-label="Remove filter"
        className="shrink-0"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

function FilterPanel({
  columns,
  columnOptions,
  appliedRows,
  appliedDateRange,
  onApply,
}: {
  columns: SubmissionColumn[]
  columnOptions: Map<string, string[]>
  appliedRows: FilterRow[]
  appliedDateRange: DateRange
  onApply: (rows: FilterRow[], dateRange: DateRange) => void
}) {
  const [open, setOpen] = useState(false)
  const [draftRows, setDraftRows] = useState<FilterRow[]>(appliedRows)
  const [draftDateRange, setDraftDateRange] = useState<DateRange>(appliedDateRange)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftRows(appliedRows)
      setDraftDateRange(appliedDateRange)
    }
    setOpen(nextOpen)
  }

  function addRow() {
    setDraftRows((rows) => [
      ...rows,
      { id: crypto.randomUUID(), field: columns[0]?.key ?? '', operator: 'includes', value: '' },
    ])
  }

  function updateRow(id: string, next: FilterRow) {
    setDraftRows((rows) => rows.map((row) => (row.id === id ? next : row)))
  }

  function removeRow(id: string) {
    setDraftRows((rows) => rows.filter((row) => row.id !== id))
  }

  function handleApply() {
    onApply(
      draftRows.filter((row) => row.field),
      draftDateRange,
    )
    setOpen(false)
  }

  function handleClear() {
    onApply([], 'all')
    setOpen(false)
  }

  const activeCount = appliedRows.length + (appliedDateRange !== 'all' ? 1 : 0)

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <ListFilter className="size-4" />
          Filter{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[34rem] max-w-[90vw] p-4">
        <div>
          <p className="mb-2 text-sm font-semibold">Search in</p>
          <Select value={draftDateRange} onValueChange={(value) => setDraftDateRange(value as DateRange)}>
            <SelectTrigger className="w-48" size="sm">
              <CalendarDays className="size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 border-t pt-4">
          <p className="mb-2 text-sm font-semibold">Advanced Filters</p>
          <div className="space-y-2">
            {draftRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No filters added yet.</p>
            ) : (
              draftRows.map((row) => (
                <FilterRowEditor
                  key={row.id}
                  row={row}
                  columns={columns}
                  columnOptions={columnOptions}
                  onChange={(next) => updateRow(row.id, next)}
                  onRemove={() => removeRow(row.id)}
                />
              ))
            )}
          </div>
          <Button
            variant="link"
            size="sm"
            className="mt-2 h-auto px-0"
            onClick={addRow}
            disabled={columns.length === 0}
          >
            <Plus className="size-4" />
            Add New Filter
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear all
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function SubmissionsTable({
  submissions,
  columns,
  formTitle = 'submissions',
}: {
  submissions: FormSubmission[]
  columns: SubmissionColumn[]
  formTitle?: string
}) {
  const [quickViewSubmission, setQuickViewSubmission] = useState<FormSubmission | null>(null)
  const [search, setSearch] = useState('')
  const [filterRows, setFilterRows] = useState<FilterRow[]>([])
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [sort, setSort] = useState<Sort | null>(null)

  const rows = useMemo(
    () =>
      submissions.map((submission) => {
        const data = submission.data as unknown as JotformSubmission
        return {
          submission,
          data,
          date: formatSubmissionDate(data),
          rawDate: data.created_at ?? '',
        }
      }),
    [submissions],
  )

  const columnOptions = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const column of columns) {
      if (!column.type || !CHOICE_ANSWER_TYPES.has(column.type)) continue
      const values = new Set<string>()
      for (const row of rows) {
        const value = getAnswerForColumn(row.data, column.key)
        if (value) values.add(value)
      }
      if (values.size > 0) map.set(column.key, Array.from(values).sort())
    }
    return map
  }, [columns, rows])

  const displayRows = useMemo(() => {
    let result = rows

    if (filterRows.length > 0) {
      result = result.filter((row) => filterRows.every((filterRow) => matchesFilterRow(row.data, filterRow)))
    }

    if (dateRange !== 'all') {
      result = result.filter((row) => matchesDateRange(row.rawDate, dateRange))
    }

    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((row) => {
        if (row.date?.toLowerCase().includes(query)) return true
        return columns.some((column) =>
          (getAnswerForColumn(row.data, column.key) || '').toLowerCase().includes(query),
        )
      })
    }

    if (sort) {
      const multiplier = sort.direction === 'asc' ? 1 : -1
      result = [...result].sort((a, b) => {
        const aValue = sort.key === SUBMITTED_KEY ? a.rawDate : getAnswerForColumn(a.data, sort.key) || ''
        const bValue = sort.key === SUBMITTED_KEY ? b.rawDate : getAnswerForColumn(b.data, sort.key) || ''
        return aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' }) * multiplier
      })
    }

    return result
  }, [rows, filterRows, dateRange, search, sort, columns])

  function handleExport() {
    const header = ['Submitted', ...columns.map((column) => column.label)]
    const body = displayRows.map((row) => [
      row.date || '',
      ...columns.map((column) => getAnswerForColumn(row.data, column.key) || ''),
    ])
    const csv = [header, ...body].map((line) => line.map(toCsvValue).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${slugify(formTitle)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search submissions..."
            className="pl-8"
          />
        </div>
        <FilterPanel
          columns={columns}
          columnOptions={columnOptions}
          appliedRows={filterRows}
          appliedDateRange={dateRange}
          onApply={(rowsToApply, range) => {
            setFilterRows(rowsToApply)
            setDateRange(range)
          }}
        />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {displayRows.length} of {submissions.length} submission{submissions.length === 1 ? '' : 's'}
          </span>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={displayRows.length === 0}>
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="divide-x divide-border bg-muted/40 hover:bg-muted/40">
              <SortableHeader
                label="Submitted"
                className="w-32 whitespace-nowrap"
                active={sort?.key === SUBMITTED_KEY}
                direction={sort?.key === SUBMITTED_KEY ? sort.direction : null}
                onSort={(direction) => setSort(direction ? { key: SUBMITTED_KEY, direction } : null)}
              />
              {columns.map((column) => (
                <SortableHeader
                  key={column.key}
                  label={column.label}
                  className="max-w-60"
                  active={sort?.key === column.key}
                  direction={sort?.key === column.key ? sort.direction : null}
                  onSort={(direction) => setSort(direction ? { key: column.key, direction } : null)}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center text-muted-foreground"
                >
                  {submissions.length === 0 ? 'No submissions yet.' : 'No submissions match your search or filter.'}
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map(({ submission, data, date }) => (
                <TableRow
                  key={submission.id}
                  onClick={() => setQuickViewSubmission(submission)}
                  className="cursor-pointer divide-x divide-border"
                >
                  <TableCell className="whitespace-nowrap text-muted-foreground">{date || '—'}</TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.key} className="max-w-60 truncate whitespace-nowrap">
                      {getAnswerForColumn(data, column.key) || ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SubmissionQuickView
        submission={quickViewSubmission}
        open={quickViewSubmission !== null}
        onOpenChange={(open) => {
          if (!open) setQuickViewSubmission(null)
        }}
      />
    </div>
  )
}
