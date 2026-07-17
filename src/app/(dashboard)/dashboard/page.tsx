import config from '@payload-config'
import { getPayload } from 'payload'
import { PageHeader } from '@/components/dashboard/page-header'
import { requireDashboardUser } from '@/lib/auth'

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

export default async function OverviewPage() {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  // overrideAccess: false so these counts respect the same permissions the user
  // has in the Payload admin, rather than silently bypassing them.
  const [contacts, submissions, drafts] = await Promise.all([
    payload.count({ collection: 'contacts', user, overrideAccess: false }),
    payload.count({ collection: 'form-submissions', user, overrideAccess: false }),
    payload.count({
      collection: 'posts',
      user,
      overrideAccess: false,
      where: { _status: { not_equals: 'published' } },
    }),
  ])

  const firstName = user.firstName || user.name || 'there'

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="A rollup of what's happening across Italia Lacrosse."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Contacts"
          value={contacts.totalDocs.toLocaleString()}
          hint="Players, donors, and coaches"
        />
        <StatCard
          label="Form submissions"
          value={submissions.totalDocs.toLocaleString()}
          hint="Sign-ups and enquiries"
        />
        <StatCard
          label="Unpublished posts"
          value={drafts.totalDocs.toLocaleString()}
          hint="Drafts awaiting review"
        />
      </div>
    </>
  )
}
