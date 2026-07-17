import config from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { ProjectsTable } from '@/components/dashboard/projects-table'
import { Button } from '@/components/dashboard/ui/button'
import { requireDashboardUser } from '@/lib/auth'

export default async function ProjectsPage() {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const { docs: projects } = await payload.find({
    collection: 'projects',
    user,
    overrideAccess: false,
    sort: '-updatedAt',
    depth: 1,
    limit: 0,
  })

  return (
    <>
      <div className="flex items-start justify-between">
        <PageHeader
          title="Projects"
          description="Committee work, tracked as milestones with owners and deadlines."
        />
        <Button asChild size="sm">
          <Link href="/dashboard/projects/new">
            <Plus className="size-4" />
            New Project
          </Link>
        </Button>
      </div>
      <ProjectsTable projects={projects} />
    </>
  )
}
