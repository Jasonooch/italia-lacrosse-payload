'use client'

import { ChevronDown } from 'lucide-react'
import type { EventType } from '@/lib/calendar-display'
import { EVENT_TYPE_DOT_STYLES, EVENT_TYPE_LABELS } from '@/lib/calendar-display'
import { Button } from '@/components/dashboard/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/dashboard/ui/dropdown-menu'

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS) as EventType[]

export function CalendarFilters({
  activeTypes,
  onToggle,
}: {
  activeTypes: Set<EventType>
  onToggle: (type: EventType, active: boolean) => void
}) {
  const label =
    activeTypes.size === EVENT_TYPES.length
      ? 'All events'
      : activeTypes.size === 0
        ? 'No events'
        : `${activeTypes.size} selected`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {label}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {EVENT_TYPES.map((type) => (
          <DropdownMenuCheckboxItem
            key={type}
            checked={activeTypes.has(type)}
            onCheckedChange={(checked) => onToggle(type, checked === true)}
            onSelect={(event) => event.preventDefault()}
          >
            <span className={'mr-1.5 size-2.5 shrink-0 rounded-full ' + EVENT_TYPE_DOT_STYLES[type]} />
            {EVENT_TYPE_LABELS[type]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
