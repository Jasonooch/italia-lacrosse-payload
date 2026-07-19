'use client'

import { useRef, useState, useTransition } from 'react'
import { FileText, Link2, Plus, Sheet, Trash2 } from 'lucide-react'
import type { Project, ProjectFile } from '@/payload-types'
import {
  addProjectResource,
  deleteProjectResource,
} from '@/app/(dashboard)/dashboard/projects/actions'
import { Button } from '@/components/dashboard/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card'
import { Input } from '@/components/dashboard/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/dashboard/ui/popover'

type Resource = NonNullable<Project['resources']>[number]

function resourceFile(resource: Resource): ProjectFile | null {
  return resource.file && typeof resource.file === 'object' ? resource.file : null
}

function resourceHref(resource: Resource): string | null {
  return resource.url || resourceFile(resource)?.url || null
}

function ResourceIcon({ resource }: { resource: Resource }) {
  const className = 'size-4 shrink-0 text-muted-foreground'
  if (resourceFile(resource)) return <FileText className={className} />
  if (resource.url?.includes('docs.google.com/spreadsheets')) return <Sheet className={className} />
  return <Link2 className={className} />
}

function AddResourceForm({ projectId, onDone }: { projectId: number; onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  const hasSource = Boolean(url.trim() || fileName)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || !hasSource) return
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      await addProjectResource(projectId, formData)
      onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Title</label>
        <Input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Fundraising tracker"
          autoFocus
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Link</label>
        <Input
          name="url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://docs.google.com/..."
          disabled={Boolean(fileName)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Or upload a file</label>
        <input
          ref={fileInputRef}
          name="file"
          type="file"
          accept=".pdf,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          disabled={Boolean(url.trim())}
          className="w-full text-xs text-muted-foreground file:mr-2 file:rounded-md file:border file:bg-transparent file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-accent"
        />
      </div>
      <Button type="submit" className="w-full" size="sm" disabled={!title.trim() || !hasSource || isPending}>
        {isPending ? 'Adding…' : 'Add Resource'}
      </Button>
    </form>
  )
}

function ResourceRow({ projectId, resource }: { projectId: number; resource: Resource }) {
  const [isPending, startTransition] = useTransition()
  const href = resourceHref(resource)

  function handleDelete() {
    startTransition(async () => {
      await deleteProjectResource(projectId, resource.id!)
    })
  }

  return (
    <li className="group flex items-center gap-2.5 rounded-md border px-3 py-2.5">
      <ResourceIcon resource={resource} />
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
        >
          {resource.title}
        </a>
      ) : (
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{resource.title}</span>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isPending}
        aria-label={`Delete ${resource.title}`}
        className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  )
}

export function ProjectResourcesCard({
  projectId,
  resources,
}: {
  projectId: number
  resources: Resource[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          Resources
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7" aria-label="Add resource">
                <Plus className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <p className="mb-3 text-sm font-semibold">Add Resource</p>
              {/* Remount on open so fields reset between adds. */}
              {open && <AddResourceForm projectId={projectId} onDone={() => setOpen(false)} />}
            </PopoverContent>
          </Popover>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No resources yet. Link a Google Sheet or upload a PDF.
          </p>
        ) : (
          <ul className="space-y-2">
            {resources.map((resource) => (
              <ResourceRow key={resource.id} projectId={projectId} resource={resource} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
