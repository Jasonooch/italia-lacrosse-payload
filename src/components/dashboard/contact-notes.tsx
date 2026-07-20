'use client'

import { useEffect, useState, useTransition } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import type { ContactNote, User } from '@/payload-types'
import { getInitials } from '@/lib/contact-display'
import {
  addContactNote,
  deleteContactNote,
  editContactNote,
} from '@/app/(dashboard)/dashboard/contacts/actions'
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar'
import { Button } from '@/components/dashboard/ui/button'
import { MentionInput, mentionLabel } from '@/components/dashboard/mention-input'

function personName(user: User | null): string {
  if (!user) return 'Someone'
  return user.name?.trim() || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
}

function mentionIdsOf(mentions: ContactNote['mentions']): number[] {
  return (mentions ?? []).map((mention) => (typeof mention === 'object' ? mention.id : mention))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Renders note text with any `@Name` that matches a known staff member
 * highlighted. Display-only — matching is by name against the staff list. */
function MentionText({ text, staff }: { text: string; staff: User[] }) {
  const names = staff
    .map(mentionLabel)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  if (names.length === 0) return <>{text}</>

  const pattern = new RegExp(`@(?:${names.map(escapeRegExp).join('|')})`, 'g')
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    parts.push(
      <span key={key++} className="rounded bg-primary/10 px-0.5 font-medium text-primary">
        {match[0]}
      </span>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return <>{parts}</>
}

/** Absolute date on first paint (matches SSR), then swaps to a relative label
 * after mount — avoids a hydration mismatch from server/client clock or TZ. */
function RelativeTime({ iso }: { iso: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const date = new Date(iso)
  if (!mounted) {
    return <span className="text-xs text-muted-foreground">{format(date, 'MMM d')}</span>
  }
  const seconds = (Date.now() - date.getTime()) / 1000
  const label = seconds < 60 ? 'just now' : formatDistanceToNow(date, { addSuffix: true })
  return (
    <span className="text-xs text-muted-foreground" title={format(date, 'PPpp')}>
      {label}
    </span>
  )
}

function NoteComposer({ contactId, staff }: { contactId: number; staff: User[] }) {
  const [draft, setDraft] = useState<{ body: string; mentionIds: number[] }>({
    body: '',
    mentionIds: [],
  })
  const [resetKey, setResetKey] = useState(0)
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!draft.body.trim()) return
    const { body, mentionIds } = draft
    startTransition(async () => {
      await addContactNote(contactId, body, mentionIds)
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
  currentUser,
  staff,
}: {
  note: ContactNote
  contactId: number
  currentUser: User
  staff: User[]
}) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<{ body: string; mentionIds: number[] }>({
    body: note.body,
    mentionIds: mentionIdsOf(note.mentions),
  })
  const author = typeof note.author === 'object' ? note.author : null
  const isAuthor = author?.id === currentUser.id
  const canDelete = isAuthor || Boolean(currentUser.roles?.includes('admin'))

  function handleDelete() {
    startTransition(async () => {
      await deleteContactNote(note.id, contactId)
    })
  }

  function startEdit() {
    setEditDraft({ body: note.body, mentionIds: mentionIdsOf(note.mentions) })
    setIsEditing(true)
  }

  function handleSaveEdit() {
    if (!editDraft.body.trim()) return
    startTransition(async () => {
      await editContactNote(note.id, contactId, editDraft.body, editDraft.mentionIds)
      setIsEditing(false)
    })
  }

  return (
    <div className="group rounded-lg border bg-card px-3 pt-3 pb-2 shadow-sm">
      <div className="flex items-start gap-2">
        <Avatar size="sm" className="mt-0.5">
          <AvatarFallback>{getInitials(author?.firstName, author?.lastName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium">{personName(author)}</span>{' '}
            <RelativeTime iso={note.createdAt} />
          </p>
          {isEditing ? (
            <div className="mt-1">
              <MentionInput
                staff={staff}
                initialValue={note.body}
                initialMentionIds={mentionIdsOf(note.mentions)}
                className="min-h-16"
                onChange={(body, mentionIds) => setEditDraft({ body, mentionIds })}
              />
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
            <p className="mt-0.5 text-sm whitespace-pre-wrap break-words">
              <MentionText text={note.body} staff={staff} />
            </p>
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
  currentUser,
  notes,
  staff,
}: {
  contactId: number
  currentUser: User
  notes: ContactNote[]
  staff: User[]
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
              currentUser={currentUser}
              staff={staff}
            />
          ))}
        </div>
      )}
    </div>
  )
}
