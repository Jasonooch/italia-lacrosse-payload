'use client'

import { useRef, useState } from 'react'
import { getInitials } from '@/lib/contact-display'
import { staffName, type StaffUser } from '@/lib/staff'
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar'
import { cn } from '@/lib/utils'

export function mentionLabel(user: StaffUser): string {
  return staffName(user)
}

/** Finds an in-progress `@query` ending at the caret: an `@` at the start of
 * the text or after whitespace, followed by the (possibly space-containing)
 * query up to the caret, with no newline or second `@`. */
function detectMention(text: string, caret: number): { at: number; query: string } | null {
  const before = text.slice(0, caret)
  const at = before.lastIndexOf('@')
  if (at === -1) return null
  const charBefore = at === 0 ? ' ' : before[at - 1]
  if (!/\s/.test(charBefore)) return null
  const query = before.slice(at + 1)
  if (query.includes('\n') || query.includes('@') || query.length > 30) return null
  return { at, query }
}

/** A textarea with @-mention autocomplete. Reports both the raw text and the
 * ids of staff still referenced by an `@Name` token in the text, so removing
 * the mention text drops the mention. Remount (via `key`) to clear it. */
export function MentionInput({
  staff,
  placeholder,
  className,
  singleLine = false,
  initialValue = '',
  initialMentionIds = [],
  onChange,
  onSubmit,
}: {
  staff: StaffUser[]
  placeholder?: string
  className?: string
  singleLine?: boolean
  initialValue?: string
  initialMentionIds?: number[]
  onChange: (body: string, mentionIds: number[]) => void
  onSubmit?: () => void
}) {
  const [body, setBody] = useState(initialValue)
  const [menu, setMenu] = useState<{ at: number; query: string } | null>(null)
  const mentionedRef = useRef<Map<number, string>>(
    new Map(
      initialMentionIds
        .map((id) => staff.find((person) => person.id === id))
        .filter((person): person is StaffUser => Boolean(person))
        .map((person) => [person.id, mentionLabel(person)]),
    ),
  )
  const ref = useRef<HTMLTextAreaElement>(null)

  const matches = menu
    ? staff
        .filter((person) => mentionLabel(person).toLowerCase().startsWith(menu.query.toLowerCase()))
        .slice(0, 6)
    : []
  const showMenu = matches.length > 0

  function commit(next: string) {
    setBody(next)
    const ids = [...mentionedRef.current.entries()]
      .filter(([, name]) => next.includes(`@${name}`))
      .map(([id]) => id)
    onChange(next, [...new Set(ids)])
  }

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = event.target.value
    commit(next)
    setMenu(detectMention(next, event.target.selectionStart))
  }

  function pick(person: StaffUser) {
    if (!menu || !ref.current) return
    const name = mentionLabel(person)
    const caret = ref.current.selectionStart
    const before = body.slice(0, menu.at)
    const after = body.slice(caret)
    const insert = `@${name} `
    const next = before + insert + after
    mentionedRef.current.set(person.id, name)
    commit(next)
    setMenu(null)
    const pos = (before + insert).length
    requestAnimationFrame(() => {
      ref.current?.focus()
      ref.current?.setSelectionRange(pos, pos)
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showMenu && (event.key === 'Enter' || event.key === 'Tab')) {
      event.preventDefault()
      pick(matches[0])
      return
    }
    if (event.key === 'Escape' && showMenu) {
      event.preventDefault()
      setMenu(null)
      return
    }
    if (onSubmit && event.key === 'Enter' && !event.shiftKey && (singleLine || !showMenu)) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={body}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={singleLine ? 1 : undefined}
        className={cn(
          'w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground',
          className,
        )}
      />
      {showMenu && (
        <div className="absolute bottom-full left-0 z-20 mb-1 w-56 overflow-hidden rounded-md border bg-popover p-1 shadow-md">
          {matches.map((person, index) => (
            <button
              key={person.id}
              type="button"
              // Keep textarea focus so the caret stays put while picking.
              onMouseDown={(event) => {
                event.preventDefault()
                pick(person)
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                index === 0 && 'bg-accent/50',
              )}
            >
              <Avatar size="sm">
                <AvatarFallback>{getInitials(person.firstName, person.lastName)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 truncate">{mentionLabel(person)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
