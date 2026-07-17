'use client'

import { useRouter } from 'next/navigation'
import type { Project } from '@/payload-types'
import { getInitials } from '@/lib/contact-display'
import { formatProjectDate } from '@/lib/project-display'
import { StatusBadge } from '@/components/dashboard/project-status-badge'
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/dashboard/ui/table'

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const router = useRouter()

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Milestones</TableHead>
            <TableHead>Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No projects yet.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => {
              const owner = project.owner && typeof project.owner === 'object' ? project.owner : null
              const milestones = project.milestones ?? []
              const completed = milestones.filter((m) => m.status === 'completed').length

              return (
                <TableRow
                  key={project.id}
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <p className="font-medium">{project.title}</p>
                    {project.description && (
                      <p className="max-w-md truncate text-xs text-muted-foreground">{project.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell>
                    {owner ? (
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(owner.firstName, owner.lastName)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{owner.name || owner.email}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {milestones.length === 0 ? '—' : `${completed}/${milestones.length} complete`}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatProjectDate(project.dueDate) || '—'}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
