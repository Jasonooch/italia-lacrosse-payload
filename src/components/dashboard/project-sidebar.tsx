import type { Event, Project, User } from '@/payload-types'
import { getInitials } from '@/lib/contact-display'
import { MILESTONE_STATUS_DOT_STYLES, formatProjectDate } from '@/lib/project-display'
import { StatusBadge } from '@/components/dashboard/project-status-badge'
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card'

type Milestone = NonNullable<Project['milestones']>[number]

export function ProjectProgressCard({ milestones }: { milestones: Milestone[] }) {
  const completed = milestones.filter((milestone) => milestone.status === 'completed').length
  const percent = milestones.length === 0 ? 0 : Math.round((completed / milestones.length) * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          Progress
          <span className="font-semibold text-primary">{percent}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        {milestones.length > 0 && (
          <ul className="space-y-2">
            {milestones.map((milestone) => (
              <li key={milestone.id} className="flex items-center gap-2 text-sm">
                <span className={`size-2 shrink-0 rounded-full ${MILESTONE_STATUS_DOT_STYLES[milestone.status]}`} />
                <span className="min-w-0 truncate">{milestone.title}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function ProjectDetailsCard({
  project,
  event,
  owner,
}: {
  project: Project
  event: Event | null
  owner: User | null
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <StatusBadge status={project.status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Start Date</span>
          <span>{formatProjectDate(project.startDate) || '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Due Date</span>
          <span>{formatProjectDate(project.dueDate) || '—'}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="shrink-0 text-muted-foreground">Owner</span>
          {owner ? (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>{getInitials(owner.firstName, owner.lastName)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{owner.name || owner.email}</span>
            </div>
          ) : (
            <span>—</span>
          )}
        </div>
        {event && (
          <div className="flex items-center justify-between gap-2">
            <span className="shrink-0 text-muted-foreground">Event</span>
            <span className="truncate text-right">{event.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
