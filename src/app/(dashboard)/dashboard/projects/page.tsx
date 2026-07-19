import config from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { ProjectsTable } from '@/components/dashboard/projects-table'
import { Button } from '@/components/dashboard/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs'
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

  // "In Progress" covers all active work (not started / in progress / on hold);
  // only finished projects move to the Completed tab.
  const active = projects.filter((project) => project.status !== 'completed')
  const completed = projects.filter((project) => project.status === 'completed')

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
      <Tabs defaultValue="in-progress">
        <TabsList>
          <TabsTrigger value="in-progress">In Progress ({active.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="in-progress">
          <ProjectsTable projects={active} emptyMessage="No projects in progress." />
        </TabsContent>
        <TabsContent value="completed">
          <ProjectsTable projects={completed} emptyMessage="No completed projects yet." />
        </TabsContent>
      </Tabs>
    </>
  )
}
