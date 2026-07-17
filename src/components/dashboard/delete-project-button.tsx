'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProject } from '@/app/(dashboard)/dashboard/projects/actions'
import { Button } from '@/components/dashboard/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/dashboard/ui/popover'

export function DeleteProjectButton({
  projectId,
  projectTitle,
}: {
  projectId: number
  projectTitle: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProject(projectId)
      } catch (err) {
        if (err && typeof err === 'object' && 'digest' in err && String(err.digest).startsWith('NEXT_REDIRECT')) {
          throw err
        }
        setOpen(false)
      }
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0 text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
          Delete
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="text-sm font-medium">Delete this project?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          &ldquo;{projectTitle}&rdquo; and its milestones will be permanently removed. This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
