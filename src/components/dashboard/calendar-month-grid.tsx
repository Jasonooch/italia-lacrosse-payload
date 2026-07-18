'use client'

import { useState } from 'react'
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { CalendarItem } from '@/lib/calendar-display'
import { EVENT_TYPE_PILL_STYLES } from '@/lib/calendar-display'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_VISIBLE_PER_DAY = 3

function itemsForDay(day: Date, items: CalendarItem[]): CalendarItem[] {
  return items.filter((item) => {
    const start = startOfDay(new Date(item.startDate))
    const end = item.endDate ? startOfDay(new Date(item.endDate)) : start
    if (end < start) return isSameDay(day, start)
    return isWithinInterval(day, { start, end })
  })
}

function EventPill({ item, onSelect }: { item: CalendarItem; onSelect: (item: CalendarItem) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={
        'block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium ' +
        EVENT_TYPE_PILL_STYLES[item.eventType]
      }
    >
      {!item.allDay && <span className="mr-1 opacity-75">{format(new Date(item.startDate), 'ha').toLowerCase()}</span>}
      {item.title}
    </button>
  )
}

export function CalendarMonthGrid({
  currentMonth,
  items,
  onSelectItem,
}: {
  currentMonth: Date
  items: CalendarItem[]
  onSelectItem: (item: CalendarItem) => void
}) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const gridStart = startOfWeek(startOfMonth(currentMonth))
  const gridEnd = endOfWeek(endOfMonth(currentMonth))
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const today = new Date()

  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-7 border-b">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayKey = day.toISOString()
          const dayItems = itemsForDay(day, items)
          const isExpanded = expandedDay === dayKey
          const visibleItems = isExpanded ? dayItems : dayItems.slice(0, MAX_VISIBLE_PER_DAY)
          const overflowCount = dayItems.length - visibleItems.length

          return (
            <div
              key={dayKey}
              className={
                'min-h-32 border-b border-r p-1.5 last:border-r-0 ' +
                (isSameMonth(day, currentMonth) ? '' : 'bg-muted/30')
              }
            >
              <span
                className={
                  'mb-1 inline-flex size-5 items-center justify-center rounded-full text-xs ' +
                  (isSameDay(day, today)
                    ? 'bg-primary font-medium text-primary-foreground'
                    : isSameMonth(day, currentMonth)
                      ? 'text-foreground'
                      : 'text-muted-foreground/50')
                }
              >
                {format(day, 'd')}
              </span>
              <div className="space-y-1">
                {visibleItems.map((item) => (
                  <EventPill key={item.id} item={item} onSelect={onSelectItem} />
                ))}
                {overflowCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpandedDay(dayKey)}
                    className="block text-xs text-muted-foreground hover:text-foreground"
                  >
                    +{overflowCount} more
                  </button>
                )}
                {isExpanded && dayItems.length > MAX_VISIBLE_PER_DAY && (
                  <button
                    type="button"
                    onClick={() => setExpandedDay(null)}
                    className="block text-xs text-muted-foreground hover:text-foreground"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
