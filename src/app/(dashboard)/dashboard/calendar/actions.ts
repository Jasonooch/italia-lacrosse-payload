'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { requireDashboardUser } from '@/lib/auth'
import type { Event } from '@/payload-types'

export interface EventFormInput {
  title: string
  eventType: Event['eventType']
  startDate: string
  endDate?: string | null
  allDay?: boolean
  location?: string | null
  team?: number | null
  description?: string | null
}

function toEventData(input: EventFormInput) {
  return {
    title: input.title.trim(),
    eventType: input.eventType,
    startDate: input.startDate,
    endDate: input.endDate || null,
    allDay: input.allDay ?? false,
    location: input.location?.trim() || null,
    team: input.team || null,
    description: input.description?.trim() || null,
  }
}

export async function createEvent(input: EventFormInput) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  await payload.create({
    collection: 'events',
    data: toEventData(input),
    user,
    overrideAccess: false,
  })

  revalidatePath('/dashboard/calendar')
}

export async function updateEvent(eventId: number, input: EventFormInput) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  await payload.update({
    collection: 'events',
    id: eventId,
    data: toEventData(input),
    user,
    overrideAccess: false,
  })

  revalidatePath('/dashboard/calendar')
}

export async function deleteEvent(eventId: number) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'events',
    id: eventId,
    user,
    overrideAccess: false,
  })

  revalidatePath('/dashboard/calendar')
}
