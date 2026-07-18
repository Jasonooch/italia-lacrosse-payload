import Link from 'next/link'
import type { Project, User } from '@/payload-types'
import { getInitials } from '@/lib/contact-display'
import { Avatar, AvatarFallback, AvatarGroup } from '@/components/dashboard/ui/avatar'

function projectTeam(project: Project): User[] {
  const owner = project.owner && typeof project.owner === 'object' ? project.owner : null
  const members = (project.team ?? []).filter((member): member is User => typeof member === 'object')

  const byId = new Map<number, User>()
  if (owner) byId.set(owner.id, owner)
  for (const member of members) byId.set(member.id, member)
  return [...byId.values()]
}

function ActiveProjectCard({ project }: { project: Project }) {
  const milestones = project.milestones ?? []
  const completed = milestones.filter((milestone) => milestone.status === 'completed').length
  const percent = milestones.length === 0 ? 0 : Math.round((completed / milestones.length) * 100)
  const team = projectTeam(project)

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="block rounded-lg border p-4 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium">{project.title}</p>
        <span className="shrink-0 text-sm font-semibold text-primary">{percent}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {milestones.length === 0 ? 'No tasks yet' : `${completed} of ${milestones.length} tasks done`}
        </p>
        {team.length > 0 && (
          <AvatarGroup>
            {team.map((member) => (
              <Avatar key={member.id} size="sm" title={member.name || member.email}>
                <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
        )}
      </div>
    </Link>
  )
}

export function ActiveProjects({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Active Projects</h2>
        <Link href="/dashboard/projects" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ActiveProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
