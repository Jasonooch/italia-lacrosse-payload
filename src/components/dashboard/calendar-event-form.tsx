'use client'

import { useState } from 'react'
import type { Team } from '@/payload-types'
import { EVENT_TYPE_LABELS, type EventType } from '@/lib/calendar-display'
import type { EventFormInput } from '@/app/(dashboard)/dashboard/calendar/actions'
import { Button } from '@/components/dashboard/ui/button'
import { Checkbox } from '@/components/dashboard/ui/checkbox'
import { DateTimePicker } from '@/components/dashboard/ui/date-time-picker'
import { Input } from '@/components/dashboard/ui/input'
import { Textarea } from '@/components/dashboard/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'

const NONE = '__none'

function parseDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS).filter((type) => type !== 'tournament') as Exclude<
  EventType,
  'tournament'
>[]

export function CalendarEventForm({
  teams,
  initial,
  submitLabel,
  isPending,
  onSubmit,
}: {
  teams: Team[]
  initial?: {
    title: string
    eventType: Exclude<EventType, 'tournament'>
    startDate: string
    endDate: string
    allDay: boolean
    location: string
    team: string
    description: string
  }
  submitLabel: string
  isPending: boolean
  onSubmit: (values: EventFormInput) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [eventType, setEventType] = useState<Exclude<EventType, 'tournament'>>(
    initial?.eventType ?? 'meeting',
  )
  const [startDate, setStartDate] = useState<Date | undefined>(parseDate(initial?.startDate))
  const [endDate, setEndDate] = useState<Date | undefined>(parseDate(initial?.endDate))
  const [allDay, setAllDay] = useState(initial?.allDay ?? false)
  const [location, setLocation] = useState(initial?.location ?? '')
  const [team, setTeam] = useState(initial?.team ?? NONE)
  const [description, setDescription] = useState(initial?.description ?? '')

  function handleSubmit() {
    if (!title.trim() || !startDate) return
    onSubmit({
      title: title.trim(),
      eventType,
      startDate: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : null,
      allDay,
      location: location || null,
      team: team === NONE ? null : Number(team),
      description: description || null,
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name" autoFocus />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Type</label>
        <Select value={eventType} onValueChange={(value) => setEventType(value as typeof eventType)}>
          <SelectTrigger className="w-full" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {EVENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Starts</label>
        <DateTimePicker value={startDate} onChange={setStartDate} placeholder="Pick a start" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Ends</label>
        <DateTimePicker value={endDate} onChange={setEndDate} placeholder="Pick an end" />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox checked={allDay} onCheckedChange={(checked) => setAllDay(checked === true)} />
        All day
      </label>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Location</label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Team</label>
        <Select value={team} onValueChange={setTeam}>
          <SelectTrigger className="w-full" size="sm">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>None</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
      </div>
      <Button
        className="w-full"
        size="sm"
        onClick={handleSubmit}
        disabled={!title.trim() || !startDate || isPending}
      >
        {submitLabel}
      </Button>
    </div>
  )
}
