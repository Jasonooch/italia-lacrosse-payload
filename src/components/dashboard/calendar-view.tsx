'use client'

import { useMemo, useState, useTransition } from 'react'
import { addMonths, format, getDaysInMonth, isSameMonth, startOfMonth, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { Event, Team, Tournament } from '@/payload-types'
import { toCalendarItems, type CalendarItem, type EventType } from '@/lib/calendar-display'
import { createEvent, type EventFormInput } from '@/app/(dashboard)/dashboard/calendar/actions'
import { Button } from '@/components/dashboard/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/dashboard/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { CalendarEventForm } from '@/components/dashboard/calendar-event-form'
import { CalendarFilters } from '@/components/dashboard/calendar-filters'
import { CalendarItemSheet } from '@/components/dashboard/calendar-item-sheet'
import { CalendarMonthGrid } from '@/components/dashboard/calendar-month-grid'

const ALL_TYPES: EventType[] = ['meeting', 'tryout', 'training-camp', 'other', 'tournament']

function NewEventButton({ teams }: { teams: Team[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(values: EventFormInput) {
    startTransition(async () => {
      await createEvent(values)
      setOpen(false)
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New event
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 max-h-[var(--radix-popover-content-available-height)] overflow-y-auto"
      >
        <p className="mb-3 text-sm font-semibold">New Event</p>
        {open && (
          <CalendarEventForm
            key="new"
            teams={teams}
            submitLabel="Create Event"
            isPending={isPending}
            onSubmit={handleSubmit}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}

export function CalendarView({
  events,
  tournaments,
  teams,
}: {
  events: Event[]
  tournaments: Tournament[]
  teams: Team[]
}) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(() => new Set(ALL_TYPES))
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const items = useMemo(() => toCalendarItems(events, tournaments), [events, tournaments])
  const visibleItems = useMemo(
    () => items.filter((item) => activeTypes.has(item.eventType)),
    [items, activeTypes],
  )
  const eventsThisMonth = useMemo(
    () => visibleItems.filter((item) => isSameMonth(new Date(item.startDate), currentMonth)).length,
    [visibleItems, currentMonth],
  )

  function handleSelectItem(item: CalendarItem) {
    setSelectedItem(item)
    setSheetOpen(true)
  }

  function handleToggleFilter(type: EventType, active: boolean) {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (active) next.add(type)
      else next.delete(type)
      return next
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h2>
          <p className="text-sm text-muted-foreground">
            {getDaysInMonth(currentMonth)} days · {eventsThisMonth} event{eventsThisMonth === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarFilters activeTypes={activeTypes} onToggle={handleToggleFilter} />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(startOfMonth(new Date()))}>
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next month"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Select value="month" onValueChange={() => {}}>
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week" disabled>
                Week
              </SelectItem>
              <SelectItem value="day" disabled>
                Day
              </SelectItem>
            </SelectContent>
          </Select>
          <NewEventButton teams={teams} />
        </div>
      </div>

      <CalendarMonthGrid currentMonth={currentMonth} items={visibleItems} onSelectItem={handleSelectItem} />

      <CalendarItemSheet item={selectedItem} teams={teams} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
