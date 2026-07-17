'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import type { Project, User } from '@/payload-types'
import { getInitials } from '@/lib/contact-display'
import {
  MILESTONE_STATUS_LABELS,
  MILESTONE_STATUS_PILL_STYLES,
  formatProjectDate,
  type MilestoneStatus,
} from '@/lib/project-display'
import { addMilestone, updateMilestoneStatus } from '@/app/(dashboard)/dashboard/projects/actions'
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/dashboard/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'

type Milestone = NonNullable<Project['milestones']>[number]

function AssigneeAvatar({ assignee }: { assignee: Milestone['assignee'] }) {
  if (!assignee || typeof assignee === 'number') return null
  return (
    <Avatar size="sm" title={assignee.name || assignee.email}>
      <AvatarFallback>{getInitials(assignee.firstName, assignee.lastName)}</AvatarFallback>
    </Avatar>
  )
}

function MilestoneRow({ projectId, milestone }: { projectId: number; milestone: Milestone }) {
  const [isPending, startTransition] = useTransition()
  const dueDate = formatProjectDate(milestone.dueDate)

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateMilestoneStatus(projectId, milestone.id!, status as MilestoneStatus)
    })
  }

  return (
    <div className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <span
        className={
          'size-2.5 shrink-0 rounded-full ' +
          (milestone.status === 'completed'
            ? 'bg-green-500'
            : milestone.status === 'in-progress'
              ? 'bg-blue-500'
              : 'bg-muted-foreground/30')
        }
      />
      <p className="min-w-0 flex-1 truncate text-sm font-medium">{milestone.title}</p>
      {dueDate && <span className="shrink-0 text-xs text-muted-foreground">{dueDate}</span>}
      <AssigneeAvatar assignee={milestone.assignee} />
      <Select value={milestone.status} onValueChange={handleStatusChange} disabled={isPending}>
        <SelectTrigger
          size="sm"
          className={
            'h-7 shrink-0 border-transparent px-2.5 text-xs font-medium shadow-none ' +
            MILESTONE_STATUS_PILL_STYLES[milestone.status]
          }
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {(Object.entries(MILESTONE_STATUS_LABELS) as [MilestoneStatus, string][]).map(
            ([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

export function NewMilestoneButton({ projectId, users }: { projectId: number; users: User[] }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignee, setAssignee] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!title.trim()) return
    startTransition(async () => {
      await addMilestone(projectId, {
        title: title.trim(),
        dueDate: dueDate || null,
        assignee: assignee ? Number(assignee) : null,
      })
      setTitle('')
      setDueDate('')
      setAssignee('')
      setOpen(false)
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New Milestone
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        <p className="mb-3 text-sm font-semibold">New Milestone</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Title</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Milestone name" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Due date</label>
            <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Assignee</label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="w-full" size="sm">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="mt-4 w-full" size="sm" onClick={handleSubmit} disabled={!title.trim() || isPending}>
          Add Milestone
        </Button>
      </PopoverContent>
    </Popover>
  )
}

function ViewTabs({ completed, total }: { completed: number; total: number }) {
  return (
    <div className="mb-3 flex items-center justify-between border-b">
      <div className="flex items-center gap-1">
        <span className="border-b-2 border-foreground px-1 pb-2 text-sm font-medium">List</span>
        <span
          title="Coming soon"
          className="cursor-not-allowed px-1 pb-2 text-sm text-muted-foreground/50"
        >
          Board
        </span>
        <span
          title="Coming soon"
          className="cursor-not-allowed px-1 pb-2 text-sm text-muted-foreground/50"
        >
          Timeline
        </span>
      </div>
      <span className="pb-2 text-xs text-muted-foreground">
        {total === 0 ? 'No milestones yet' : `${completed} of ${total} milestones complete`}
      </span>
    </div>
  )
}

export function ProjectMilestones({ projectId, milestones }: { projectId: number; milestones: Milestone[] }) {
  const completed = milestones.filter((milestone) => milestone.status === 'completed').length

  return (
    <div>
      <ViewTabs completed={completed} total={milestones.length} />
      <div className="rounded-lg border">
        {milestones.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No milestones yet.</p>
        ) : (
          milestones.map((milestone) => (
            <MilestoneRow key={milestone.id} projectId={projectId} milestone={milestone} />
          ))
        )}
      </div>
    </div>
  )
}
