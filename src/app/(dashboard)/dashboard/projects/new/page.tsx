import config from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireDashboardUser } from '@/lib/auth'
import { PageHeader } from '@/components/dashboard/page-header'
import { ProjectForm } from '@/components/dashboard/project-form'

export default async function NewProjectPage() {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const [{ docs: users }, { docs: tournaments }] = await Promise.all([
    payload.find({ collection: 'users', user, overrideAccess: false, sort: 'firstName', limit: 0 }),
    payload.find({ collection: 'tournaments', user, overrideAccess: false, sort: '-year', limit: 0 }),
  ])

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/projects"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to projects
      </Link>
      <PageHeader title="New Project" description="Create a project to track committee work and milestones." />
      <ProjectForm users={users} tournaments={tournaments} />
    </div>
  )
}
