'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Team } from '@/payload-types'
import type { StaffUser } from '@/lib/staff'
import type { CalendarItem } from '@/lib/calendar-display'
import { EVENT_TYPE_LABELS, EVENT_TYPE_PILL_STYLES } from '@/lib/calendar-display'
import { deleteEvent, updateEvent, type EventFormInput } from '@/app/(dashboard)/dashboard/calendar/actions'
import { Badge } from '@/components/dashboard/ui/badge'
import { Button } from '@/components/dashboard/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/dashboard/ui/sheet'
import { CalendarEventForm, staffLabel } from '@/components/dashboard/calendar-event-form'

function formatItemDate(item: CalendarItem): string {
  const start = new Date(item.startDate)
  const end = item.endDate ? new Date(item.endDate) : null
  const dateFormat = item.allDay ? 'MMM d, yyyy' : "MMM d, yyyy 'at' h:mma"

  const startLabel = format(start, dateFormat)
  if (!end || end.getTime() === start.getTime()) return startLabel
  return `${startLabel} – ${format(end, dateFormat)}`
}

function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === '') return null
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-sm">{value}</p>
    </div>
  )
}

type SheetMode = 'view' | 'edit' | 'delete'

export function CalendarItemSheet({
  item,
  teams,
  staff,
  open,
  onOpenChange,
}: {
  item: CalendarItem | null
  teams: Team[]
  staff: StaffUser[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [mode, setMode] = useState<SheetMode>('view')
  const [isPending, startTransition] = useTransition()

  // Always land on the read-only view when a (new) item is opened.
  useEffect(() => {
    setMode('view')
  }, [item?.id, open])

  if (!item) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto" />
      </Sheet>
    )
  }

  const teamName = item.team ? (teams.find((t) => t.id === item.team)?.name ?? null) : null
  const assignedStaffNames = item.assignedStaff
    .map((id) => staff.find((person) => person.id === id))
    .filter((person): person is StaffUser => Boolean(person))
    .map(staffLabel)
    .join(', ')

  function handleEdit(values: EventFormInput) {
    startTransition(async () => {
      await updateEvent(item!.docId, values)
      onOpenChange(false)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteEvent(item!.docId)
      onOpenChange(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="truncate pr-8">{item.title}</SheetTitle>
          <SheetDescription>{formatItemDate(item)}</SheetDescription>
          <Badge className={'mt-1 w-fit ' + EVENT_TYPE_PILL_STYLES[item.eventType]}>
            {EVENT_TYPE_LABELS[item.eventType]}
          </Badge>
        </SheetHeader>

        {mode === 'view' && (
          <>
            <div className="grid gap-4 px-4">
              <DetailField label="Location" value={item.location} />
              <DetailField label="Team" value={teamName} />
              <DetailField label="Assigned Staff" value={assignedStaffNames} />
              <DetailField label="Description" value={item.description} />
            </div>
            <SheetFooter>
              {item.kind === 'event' ? (
                <>
                  <Button onClick={() => setMode('edit')}>Edit details</Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setMode('delete')}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <Button asChild variant="outline">
                  <Link href={`/admin/collections/tournaments/${item.docId}`}>View in Tournaments</Link>
                </Button>
              )}
            </SheetFooter>
          </>
        )}

        {mode === 'edit' && (
          <div className="space-y-2 px-4">
            <CalendarEventForm
              teams={teams}
              staff={staff}
              submitLabel="Save Changes"
              isPending={isPending}
              initial={{
                title: item.title,
                eventType: item.eventType as Exclude<typeof item.eventType, 'tournament'>,
                startDate: item.startDate,
                endDate: item.endDate ?? '',
                allDay: item.allDay,
                location: item.location ?? '',
                team: item.team ? String(item.team) : '',
                assignedStaff: item.assignedStaff,
                description: item.description ?? '',
              }}
              onSubmit={handleEdit}
            />
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setMode('view')}>
              Cancel
            </Button>
          </div>
        )}

        {mode === 'delete' && (
          <div className="px-4">
            <p className="text-sm font-medium">Delete this event?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              &ldquo;{item.title}&rdquo; will be permanently removed.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setMode('view')} disabled={isPending}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
