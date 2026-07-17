'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import type { Event, Project, User } from '@/payload-types'
import { getInitials } from '@/lib/contact-display'
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '@/lib/project-display'
import {
  createProject,
  updateProject,
  type ProjectFormInput,
} from '@/app/(dashboard)/dashboard/projects/actions'
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Textarea } from '@/components/dashboard/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'

const NONE = '__none'

function idOf(value: number | { id: number } | null | undefined): number | null {
  if (value == null) return null
  return typeof value === 'object' ? value.id : value
}

function dateInputValue(value?: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

export function ProjectForm({
  project,
  users,
  events,
}: {
  project?: Project
  users: User[]
  events: Event[]
}) {
  const isEdit = Boolean(project)

  const [title, setTitle] = useState(project?.title ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'not-started')
  const [startDate, setStartDate] = useState(dateInputValue(project?.startDate))
  const [dueDate, setDueDate] = useState(dateInputValue(project?.dueDate))
  const [event, setEvent] = useState<string>(idOf(project?.event) ? String(idOf(project?.event)) : NONE)
  const [owner, setOwner] = useState<string>(idOf(project?.owner) ? String(idOf(project?.owner)) : NONE)
  const [team, setTeam] = useState<number[]>(
    (project?.team ?? []).map((member) => idOf(member)).filter((id): id is number => id != null),
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const addableUsers = users.filter((candidate) => !team.includes(candidate.id))

  function handleSubmit() {
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setError(null)

    const input: ProjectFormInput = {
      title,
      description,
      status,
      startDate: startDate || null,
      dueDate: dueDate || null,
      event: event === NONE ? null : Number(event),
      owner: owner === NONE ? null : Number(owner),
      team,
    }

    startTransition(async () => {
      try {
        if (isEdit && project) {
          await updateProject(project.id, input)
        } else {
          await createProject(input)
        }
      } catch (err) {
        // redirect() throws a NEXT_REDIRECT that must be rethrown to navigate.
        if (err && typeof err === 'object' && 'digest' in err && String(err.digest).startsWith('NEXT_REDIRECT')) {
          throw err
        }
        setError('Something went wrong saving the project.')
      }
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project name" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Status</label>
        <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Start date</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Due date</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Owner</label>
        <Select value={owner} onValueChange={setOwner}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Unassigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={String(user.id)}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Event</label>
        <Select value={event} onValueChange={setEvent}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>None</SelectItem>
            {events.map((ev) => (
              <SelectItem key={ev.id} value={String(ev.id)}>
                {ev.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {events.length === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">No events available to link.</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Team</label>
        <div className="space-y-2">
          {team.length === 0 && <p className="text-sm text-muted-foreground">No team members added.</p>}
          {team
            .map((id) => users.find((u) => u.id === id))
            .filter((u): u is User => Boolean(u))
            .map((member) => (
              <div key={member.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm">{member.name || member.email}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove ${member.name || member.email}`}
                  onClick={() => setTeam((prev) => prev.filter((id) => id !== member.id))}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          {addableUsers.length > 0 && (
            <Select value="" onValueChange={(value) => setTeam((prev) => [...prev, Number(value)])}>
              <SelectTrigger className="w-full" size="sm">
                <SelectValue placeholder="Add team member…" />
              </SelectTrigger>
              <SelectContent>
                {addableUsers.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2 border-t pt-4">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isEdit ? 'Save Changes' : 'Create Project'}
        </Button>
        <Button asChild variant="outline">
          <Link href={isEdit && project ? `/dashboard/projects/${project.id}` : '/dashboard/projects'}>
            Cancel
          </Link>
        </Button>
      </div>
    </div>
  )
}
