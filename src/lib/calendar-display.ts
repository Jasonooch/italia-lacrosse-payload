import type { Event, Tournament } from '@/payload-types'

export type EventType = Event['eventType'] | 'tournament'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting: 'Meeting',
  tryout: 'Tryout',
  'training-camp': 'Training Camp',
  other: 'Other',
  tournament: 'Tournament',
}

export const EVENT_TYPE_PILL_STYLES: Record<EventType, string> = {
  meeting: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  tryout: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  'training-camp': 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  other: 'bg-muted text-muted-foreground',
  tournament: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
}

/** Solid swatch color, used for the sidebar filter list where a pale pill
 * background wouldn't read as a distinct color. */
export const EVENT_TYPE_DOT_STYLES: Record<EventType, string> = {
  meeting: 'bg-purple-500',
  tryout: 'bg-orange-500',
  'training-camp': 'bg-teal-500',
  other: 'bg-muted-foreground/40',
  tournament: 'bg-blue-500',
}

export interface CalendarItem {
  /** Prefixed with the source collection so ids never collide across the two. */
  id: string
  kind: 'event' | 'tournament'
  /** The underlying document id, for links/edit actions. */
  docId: number
  title: string
  eventType: EventType
  startDate: string
  endDate: string | null
  allDay: boolean
  /** Only populated for kind: 'event' — carried through so the edit form can
   * prefill without a second fetch, and so saving doesn't clobber fields the
   * calendar grid itself never needed to display. */
  location: string | null
  team: number | null
  assignedStaff: number[]
  description: string | null
}

/** Normalizes the two source collections into one unified shape for the
 * calendar grid. Tournaments only have day-granularity dates, so they always
 * render as all-day items. */
export function toCalendarItems(events: Event[], tournaments: Tournament[]): CalendarItem[] {
  const eventItems: CalendarItem[] = events.map((event): CalendarItem => ({
    id: `event-${event.id}`,
    kind: 'event',
    docId: event.id,
    title: event.title,
    eventType: event.eventType,
    startDate: event.startDate,
    endDate: event.endDate ?? null,
    allDay: event.allDay ?? false,
    location: event.location ?? null,
    team: typeof event.team === 'object' ? (event.team?.id ?? null) : (event.team ?? null),
    assignedStaff: (event.assignedStaff ?? []).map((staff) =>
      typeof staff === 'object' ? staff.id : staff,
    ),
    description: event.description ?? null,
  }))

  const tournamentItems: CalendarItem[] = tournaments.map((tournament): CalendarItem => ({
    id: `tournament-${tournament.id}`,
    kind: 'tournament',
    docId: tournament.id,
    title: tournament.name,
    eventType: 'tournament',
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    allDay: true,
    location: null,
    team: null,
    assignedStaff: [],
    description: null,
  }))

  return [...eventItems, ...tournamentItems]
}
