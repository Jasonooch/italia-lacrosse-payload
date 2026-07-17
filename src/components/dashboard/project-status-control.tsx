'use client'

import { useTransition } from 'react'
import type { Project } from '@/payload-types'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES, type ProjectStatus } from '@/lib/project-display'
import { updateProjectStatus } from '@/app/(dashboard)/dashboard/projects/actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'

/** Inline, editable project status. Renders as a status pill that opens a
 * dropdown to change the project's own status. */
export function ProjectStatusControl({
  projectId,
  status,
}: {
  projectId: number
  status: Project['status']
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(next: string) {
    if (next === status) return
    startTransition(async () => {
      await updateProjectStatus(projectId, next as ProjectStatus)
    })
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        size="sm"
        className={
          'h-7 border-transparent px-2.5 text-xs font-medium shadow-none ' +
          PROJECT_STATUS_STYLES[status]
        }
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        {(Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]).map(
          ([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ),
        )}
      </SelectContent>
    </Select>
  )
}
