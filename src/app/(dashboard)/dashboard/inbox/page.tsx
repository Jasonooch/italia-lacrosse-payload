import config from '@payload-config'
import { getPayload } from 'payload'
import type { Project, User } from '@/payload-types'
import { requireDashboardUser } from '@/lib/auth'
import { InboxList, type InboxItem } from '@/components/dashboard/inbox-list'

function actorLabel(actor: number | User | null | undefined): string {
  if (!actor || typeof actor !== 'object') return 'Someone'
  return actor.name?.trim() || [actor.firstName, actor.lastName].filter(Boolean).join(' ') || actor.email
}

export default async function InboxPage() {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'notifications',
    where: { recipient: { equals: user.id } },
    user,
    overrideAccess: false,
    depth: 1,
    sort: '-createdAt',
    limit: 100,
  })

  const items: InboxItem[] = docs.map((doc) => {
    const project = doc.project && typeof doc.project === 'object' ? (doc.project as Project) : null
    return {
      id: doc.id,
      type: doc.type,
      summary: doc.summary,
      actorName: actorLabel(doc.actor),
      projectId: project ? project.id : typeof doc.project === 'number' ? doc.project : null,
      projectTitle: project ? project.title : null,
      createdAt: doc.createdAt,
      read: Boolean(doc.read),
    }
  })

  return <InboxList items={items} />
}
