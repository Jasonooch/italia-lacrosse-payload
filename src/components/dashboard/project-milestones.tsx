'use client'

import { useEffect, useState, useTransition } from 'react'
import { GripVertical, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Project, User } from '@/payload-types'
import { getInitials } from '@/lib/contact-display'
import {
  MILESTONE_STATUS_LABELS,
  MILESTONE_STATUS_PILL_STYLES,
  formatProjectDate,
  type MilestoneStatus,
} from '@/lib/project-display'
import {
  addMilestone,
  deleteMilestone,
  reorderMilestones,
  updateMilestone,
  updateMilestoneStatus,
  type MilestoneInput,
} from '@/app/(dashboard)/dashboard/projects/actions'
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

const UNASSIGNED = 'unassigned'

function assigneeId(assignee: Milestone['assignee']): number | null {
  if (assignee == null) return null
  return typeof assignee === 'object' ? assignee.id : assignee
}

function AssigneeAvatar({ assignee }: { assignee: Milestone['assignee'] }) {
  if (!assignee || typeof assignee === 'number') return null
  return (
    <Avatar size="sm" title={assignee.name || assignee.email}>
      <AvatarFallback>{getInitials(assignee.firstName, assignee.lastName)}</AvatarFallback>
    </Avatar>
  )
}

/** Shared title / due date / assignee fields for creating and editing a
 * milestone. Owns its own field state and hands finished values back on save. */
function MilestoneForm({
  users,
  initial,
  submitLabel,
  isPending,
  onSubmit,
}: {
  users: User[]
  initial?: { title: string; dueDate: string; assignee: string }
  submitLabel: string
  isPending: boolean
  onSubmit: (values: MilestoneInput) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [assignee, setAssignee] = useState(initial?.assignee ?? UNASSIGNED)

  function handleSubmit() {
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      dueDate: dueDate || null,
      assignee: assignee === UNASSIGNED ? null : Number(assignee),
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Title</label>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Milestone name"
          autoFocus
        />
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
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={String(user.id)}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" size="sm" onClick={handleSubmit} disabled={!title.trim() || isPending}>
        {submitLabel}
      </Button>
    </div>
  )
}

type ActionMode = 'menu' | 'edit' | 'delete'

/** Kebab menu sitting to the right of the status pill. Opens an inline menu
 * that switches between editing the milestone and confirming deletion. */
function MilestoneActions({
  projectId,
  milestone,
  users,
}: {
  projectId: number
  milestone: Milestone
  users: User[]
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ActionMode>('menu')
  const [isPending, startTransition] = useTransition()

  function close() {
    setOpen(false)
  }

  // Reset back to the menu view whenever the popover reopens.
  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setMode('menu')
  }

  function handleEdit(values: MilestoneInput) {
    startTransition(async () => {
      await updateMilestone(projectId, milestone.id!, values)
      close()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteMilestone(projectId, milestone.id!)
      close()
    })
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground"
          aria-label="Milestone actions"
        >
          <MoreVertical className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className={mode === 'menu' ? 'w-40 p-1' : 'w-72'}>
        {mode === 'menu' && (
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Pencil className="size-4 text-muted-foreground" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMode('delete')}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4" />
              Delete
            </button>
          </div>
        )}

        {mode === 'edit' && (
          <>
            <p className="mb-3 text-sm font-semibold">Edit Milestone</p>
            <MilestoneForm
              users={users}
              submitLabel="Save Changes"
              isPending={isPending}
              initial={{
                title: milestone.title,
                dueDate: milestone.dueDate ? milestone.dueDate.slice(0, 10) : '',
                assignee: assigneeId(milestone.assignee)?.toString() ?? UNASSIGNED,
              }}
              onSubmit={handleEdit}
            />
          </>
        )}

        {mode === 'delete' && (
          <>
            <p className="text-sm font-medium">Delete this milestone?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              &ldquo;{milestone.title}&rdquo; will be permanently removed.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setMode('menu')} disabled={isPending}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                Delete
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

function SortableMilestoneRow({
  projectId,
  milestone,
  users,
}: {
  projectId: number
  milestone: Milestone
  users: User[]
}) {
  const [isPending, startTransition] = useTransition()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: milestone.id!,
  })
  const dueDate = formatProjectDate(milestone.dueDate)

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateMilestoneStatus(projectId, milestone.id!, status as MilestoneStatus)
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        'flex flex-col gap-2 border-b bg-card px-2 py-3 last:border-b-0 sm:flex-row sm:items-start ' +
        (isDragging ? 'relative z-10 rounded-md shadow-md' : '')
      }
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <span
          className={
            'mt-1.5 size-2.5 shrink-0 rounded-full ' +
            (milestone.status === 'completed'
              ? 'bg-green-500'
              : milestone.status === 'in-progress'
                ? 'bg-blue-500'
                : 'bg-muted-foreground/30')
          }
        />
        <p className="min-w-0 flex-1 text-sm font-medium">{milestone.title}</p>
      </div>
      {/* Due date / assignee / status / actions wrap onto their own row below
          the title on narrow screens instead of squeezing it into a sliver. */}
      <div className="flex shrink-0 items-center gap-2 pl-6 sm:pl-0">
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
        <MilestoneActions projectId={projectId} milestone={milestone} users={users} />
      </div>
    </div>
  )
}

export function NewMilestoneButton({ projectId, users }: { projectId: number; users: User[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(values: MilestoneInput) {
    startTransition(async () => {
      await addMilestone(projectId, values)
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
      <PopoverContent align="end" className="w-80">
        <p className="mb-3 text-sm font-semibold">New Milestone</p>
        {/* Remount on open so fields reset between adds. */}
        {open && (
          <MilestoneForm
            key="new"
            users={users}
            submitLabel="Add Milestone"
            isPending={isPending}
            onSubmit={handleSubmit}
          />
        )}
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

export function ProjectMilestones({
  projectId,
  milestones,
  users,
}: {
  projectId: number
  milestones: Milestone[]
  users: User[]
}) {
  const [items, setItems] = useState(milestones)
  const [, startTransition] = useTransition()

  // Re-sync local order whenever the server sends a different set/content of
  // milestones (add, edit, delete, status change, or a persisted reorder).
  const signature = milestones
    .map((m) => `${m.id}:${m.title}:${m.status}:${m.dueDate ?? ''}:${assigneeId(m.assignee) ?? ''}`)
    .join('|')
  useEffect(() => {
    setItems(milestones)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((m) => m.id === active.id)
    const newIndex = items.findIndex((m) => m.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next)
    startTransition(async () => {
      await reorderMilestones(
        projectId,
        next.map((m) => m.id!),
      )
    })
  }

  const completed = items.filter((milestone) => milestone.status === 'completed').length

  return (
    <div>
      <ViewTabs completed={completed} total={items.length} />
      <div className="rounded-lg border">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No milestones yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((m) => m.id!)} strategy={verticalListSortingStrategy}>
              {items.map((milestone) => (
                <SortableMilestoneRow
                  key={milestone.id}
                  projectId={projectId}
                  milestone={milestone}
                  users={users}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
