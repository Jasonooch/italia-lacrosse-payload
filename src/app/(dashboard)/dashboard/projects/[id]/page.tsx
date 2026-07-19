import config from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import type { Tournament, User } from '@/payload-types'
import { requireDashboardUser } from '@/lib/auth'
import { ProjectStatusControl } from '@/components/dashboard/project-status-control'
import { ProjectDetailsCard, ProjectProgressCard } from '@/components/dashboard/project-sidebar'
import { ProjectTeamCard } from '@/components/dashboard/project-team-card'
import { NewMilestoneButton, ProjectMilestones } from '@/components/dashboard/project-milestones'
import { ProjectResourcesCard } from '@/components/dashboard/project-resources'
import { Button } from '@/components/dashboard/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const project = await payload.findByID({
    collection: 'projects',
    id,
    user,
    overrideAccess: false,
    disableErrors: true,
    depth: 2,
  })

  if (!project) {
    notFound()
  }

  const { docs: allUsers } = await payload.find({
    collection: 'users',
    user,
    overrideAccess: false,
    sort: 'firstName',
    limit: 0,
  })

  const owner = project.owner && typeof project.owner === 'object' ? (project.owner as User) : null
  const team = (project.team ?? []).filter((member): member is User => typeof member === 'object')
  const tournament =
    project.tournament && typeof project.tournament === 'object'
      ? (project.tournament as Tournament)
      : null
  const milestones = project.milestones ?? []

  return (
    <>
      <Link
        href="/dashboard/projects"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to projects
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
            <ProjectStatusControl projectId={project.id} status={project.status} />
          </div>
          {project.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/projects/${project.id}/edit`}>
              <Pencil className="size-4" />
              Edit Project
            </Link>
          </Button>
          <NewMilestoneButton projectId={project.id} users={allUsers} />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <ProjectProgressCard milestones={milestones} />
              <ProjectResourcesCard projectId={project.id} resources={project.resources ?? []} />
            </div>
            <div className="space-y-6">
              <ProjectDetailsCard project={project} tournament={tournament} owner={owner} />
              <ProjectTeamCard projectId={project.id} owner={owner} team={team} allUsers={allUsers} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="milestones">
          <ProjectMilestones projectId={project.id} milestones={milestones} users={allUsers} />
        </TabsContent>
      </Tabs>
    </>
  )
}
