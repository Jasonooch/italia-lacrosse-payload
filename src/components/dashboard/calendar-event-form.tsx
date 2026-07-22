'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { Team } from '@/payload-types'
import { staffName, type StaffUser } from '@/lib/staff'
import { getInitials } from '@/lib/contact-display'
import { EVENT_TYPE_LABELS, type EventType } from '@/lib/calendar-display'
import type { EventFormInput } from '@/app/(dashboard)/dashboard/calendar/actions'
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar'
import { Button } from '@/components/dashboard/ui/button'
import { Checkbox } from '@/components/dashboard/ui/checkbox'
import { DateTimePicker } from '@/components/dashboard/ui/date-time-picker'
import { Input } from '@/components/dashboard/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/dashboard/ui/popover'
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

export function staffLabel(person: StaffUser): string {
  return staffName(person)
}

function StaffPicker({
  staff,
  selected,
  onChange,
}: {
  staff: StaffUser[]
  selected: number[]
  onChange: (ids: number[]) => void
}) {
  const [open, setOpen] = useState(false)

  const assignedIds = new Set(selected)
  const assigned = staff.filter((person) => assignedIds.has(person.id))
  const addable = staff.filter((person) => !assignedIds.has(person.id))

  function handleAdd(id: number) {
    const next = [...selected, id]
    onChange(next)
    if (next.length === staff.length) setOpen(false)
  }

  function handleAddAll() {
    onChange(staff.map((person) => person.id))
    setOpen(false)
  }

  function handleRemove(id: number) {
    onChange(selected.filter((existing) => existing !== id))
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-xs text-muted-foreground">Assigned staff</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Add staff"
              disabled={addable.length === 0}
            >
              <Plus className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
            {addable.length > 1 && (
              <button
                type="button"
                onClick={handleAddAll}
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Assign everyone
              </button>
            )}
            {addable.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => handleAdd(person.id)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(person.firstName, person.lastName)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 truncate">{staffLabel(person)}</span>
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
      {assigned.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one assigned yet.</p>
      ) : (
        <div className="space-y-1.5">
          {assigned.map((person) => (
            <div key={person.id} className="group flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>{getInitials(person.firstName, person.lastName)}</AvatarFallback>
              </Avatar>
              <p className="min-w-0 flex-1 truncate text-sm">{staffLabel(person)}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${staffLabel(person)}`}
                onClick={() => handleRemove(person.id)}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CalendarEventForm({
  teams,
  staff,
  initial,
  submitLabel,
  isPending,
  onSubmit,
}: {
  teams: Team[]
  staff: StaffUser[]
  initial?: {
    title: string
    eventType: Exclude<EventType, 'tournament'>
    startDate: string
    endDate: string
    allDay: boolean
    location: string
    team: string
    assignedStaff: number[]
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
  const [assignedStaff, setAssignedStaff] = useState<number[]>(initial?.assignedStaff ?? [])
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
      assignedStaff,
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
      <StaffPicker staff={staff} selected={assignedStaff} onChange={setAssignedStaff} />
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
