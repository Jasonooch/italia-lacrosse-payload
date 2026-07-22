'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { getInitials } from '@/lib/contact-display'
import { staffName, type StaffUser } from '@/lib/staff'
import {
  addContactNote,
  deleteContactNote,
  editContactNote,
} from '@/app/(dashboard)/dashboard/contacts/actions'
import { RelativeTime } from '@/components/dashboard/relative-time'
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar'
import { Button } from '@/components/dashboard/ui/button'
import { MentionInput } from '@/components/dashboard/mention-input'
import { MentionText } from '@/lib/render-mention-text'

/** Slim, client-safe projection of a `contact-notes` doc — see `toNoteItem`
 * in the contact detail page. */
export interface NoteItem {
  id: number
  createdAt: string
  body: string
  author: StaffUser | null
  mentions: number[]
}

function ActionError({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

function NoteComposer({ contactId, staff }: { contactId: number; staff: StaffUser[] }) {
  const [draft, setDraft] = useState<{ body: string; mentionIds: number[] }>({
    body: '',
    mentionIds: [],
  })
  const [resetKey, setResetKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!draft.body.trim()) return
    const { body, mentionIds } = draft
    startTransition(async () => {
      const result = await addContactNote(contactId, body, mentionIds)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setError(null)
      setDraft({ body: '', mentionIds: [] })
      setResetKey((key) => key + 1)
    })
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="px-4 py-3">
        <MentionInput
          key={resetKey}
          staff={staff}
          placeholder="Add a note... use @ to mention someone"
          className="min-h-16"
          onChange={(body, mentionIds) => setDraft({ body, mentionIds })}
        />
        <ActionError message={error} />
      </div>
      <div className="flex justify-end px-3 pt-2 pb-3">
        <Button size="sm" onClick={submit} disabled={!draft.body.trim() || isPending}>
          Add Note
        </Button>
      </div>
    </div>
  )
}

function NoteCard({
  note,
  contactId,
  currentUserId,
  isAdmin,
  staff,
}: {
  note: NoteItem
  contactId: number
  currentUserId: number
  isAdmin: boolean
  staff: StaffUser[]
}) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ body: string; mentionIds: number[] }>({
    body: note.body,
    mentionIds: note.mentions,
  })
  const isAuthor = note.author?.id === currentUserId
  const canDelete = isAuthor || isAdmin

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteContactNote(note.id, contactId)
      setError(result.ok ? null : result.error)
    })
  }

  function startEdit() {
    setEditDraft({ body: note.body, mentionIds: note.mentions })
    setError(null)
    setIsEditing(true)
  }

  function handleSaveEdit() {
    if (!editDraft.body.trim()) return
    startTransition(async () => {
      const result = await editContactNote(note.id, contactId, editDraft.body, editDraft.mentionIds)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setError(null)
      setIsEditing(false)
    })
  }

  return (
    <div className="group rounded-lg border bg-card px-3 pt-3 pb-2 shadow-sm">
      <div className="flex items-start gap-2">
        <Avatar size="sm" className="mt-0.5">
          <AvatarFallback>{getInitials(note.author?.firstName, note.author?.lastName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium">{staffName(note.author)}</span>{' '}
            <RelativeTime iso={note.createdAt} />
          </p>
          {isEditing ? (
            <div className="mt-1">
              <MentionInput
                staff={staff}
                initialValue={note.body}
                initialMentionIds={note.mentions}
                className="min-h-16"
                onChange={(body, mentionIds) => setEditDraft({ body, mentionIds })}
              />
              <ActionError message={error} />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={!editDraft.body.trim() || isPending}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-0.5 text-sm whitespace-pre-wrap break-words">
                <MentionText text={note.body} staff={staff} />
              </p>
              <ActionError message={error} />
            </>
          )}
        </div>
        {!isEditing && (isAuthor || canDelete) && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100">
            {isAuthor && (
              <Button variant="ghost" size="icon-xs" aria-label="Edit note" onClick={startEdit}>
                <Pencil className="size-3.5" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Delete note"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ContactNotes({
  contactId,
  currentUserId,
  isAdmin,
  notes,
  staff,
}: {
  contactId: number
  currentUserId: number
  isAdmin: boolean
  notes: NoteItem[]
  staff: StaffUser[]
}) {
  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="space-y-4">
      <NoteComposer contactId={contactId} staff={staff} />
      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              contactId={contactId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              staff={staff}
            />
          ))}
        </div>
      )}
    </div>
  )
}
