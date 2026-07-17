import config from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import type { Event, User } from '@/payload-types'
import { requireDashboardUser } from '@/lib/auth'
import { StatusBadge } from '@/components/dashboard/project-status-badge'
import { ProjectDetailsCard, ProjectProgressCard } from '@/components/dashboard/project-sidebar'
import { ProjectTeamCard } from '@/components/dashboard/project-team-card'
import { NewMilestoneButton, ProjectMilestones } from '@/components/dashboard/project-milestones'
import { Button } from '@/components/dashboard/ui/button'

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
  const event = project.event && typeof project.event === 'object' ? (project.event as Event) : null
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

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
            <StatusBadge status={project.status} />
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectMilestones projectId={project.id} milestones={milestones} />
        </div>
        <div className="space-y-6">
          <ProjectProgressCard milestones={milestones} />
          <ProjectDetailsCard project={project} event={event} owner={owner} />
          <ProjectTeamCard projectId={project.id} owner={owner} team={team} allUsers={allUsers} />
        </div>
      </div>
    </>
  )
}
