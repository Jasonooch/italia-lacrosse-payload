import config from '@payload-config'
import { getPayload } from 'payload'
import { requireDashboardUser } from '@/lib/auth'
import { CalendarView } from '@/components/dashboard/calendar-view'

export default async function CalendarPage() {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const [{ docs: events }, { docs: tournaments }, { docs: teams }] = await Promise.all([
    payload.find({ collection: 'events', user, overrideAccess: false, depth: 0, limit: 0 }),
    payload.find({ collection: 'tournaments', user, overrideAccess: false, depth: 0, limit: 0 }),
    payload.find({ collection: 'teams', user, overrideAccess: false, sort: 'name', limit: 0 }),
  ])

  return <CalendarView events={events} tournaments={tournaments} teams={teams} />
}
