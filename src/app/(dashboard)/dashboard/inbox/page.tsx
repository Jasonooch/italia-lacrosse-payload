import config from '@payload-config'
import { getPayload } from 'payload'
import type { Contact, Project, User } from '@/payload-types'
import { requireDashboardUser } from '@/lib/auth'
import { InboxList, type InboxItem } from '@/components/dashboard/inbox-list'
import { InboxActivityFeed } from '@/components/dashboard/inbox-activity-feed'
import { fetchGlobalActivityPage } from '@/lib/inbox-activity'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs'

function actorLabel(actor: number | User | null | undefined): string {
  if (!actor || typeof actor !== 'object') return 'Someone'
  return actor.name?.trim() || [actor.firstName, actor.lastName].filter(Boolean).join(' ') || actor.email
}

export default async function InboxPage() {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const [{ docs }, activityPage] = await Promise.all([
    payload.find({
      collection: 'notifications',
      where: { recipient: { equals: user.id } },
      user,
      overrideAccess: false,
      depth: 1,
      sort: '-createdAt',
      limit: 100,
    }),
    fetchGlobalActivityPage(payload, user),
  ])

  const items: InboxItem[] = docs.map((doc) => {
    const project = doc.project && typeof doc.project === 'object' ? (doc.project as Project) : null
    const contact = doc.contact && typeof doc.contact === 'object' ? (doc.contact as Contact) : null
    return {
      id: doc.id,
      type: doc.type,
      summary: doc.summary,
      actorName: actorLabel(doc.actor),
      projectId: project ? project.id : typeof doc.project === 'number' ? doc.project : null,
      projectTitle: project ? project.title : null,
      contactId: contact ? contact.id : typeof doc.contact === 'number' ? doc.contact : null,
      contactTitle: contact ? contact.fullName ?? null : null,
      createdAt: doc.createdAt,
      read: Boolean(doc.read),
    }
  })

  const hasUnread = items.some((item) => !item.read)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Inbox</h1>
      <Tabs defaultValue="for-you">
        <TabsList>
          <TabsTrigger value="for-you" className="inline-flex items-center gap-1.5">
            For You
            {hasUnread && <span className="size-1.5 rounded-full bg-primary" />}
          </TabsTrigger>
          <TabsTrigger value="all-activity">All Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="for-you" className="pt-4">
          <InboxList items={items} />
        </TabsContent>
        <TabsContent value="all-activity" className="pt-4">
          <InboxActivityFeed initial={activityPage} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
