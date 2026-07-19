'use client'

import { useEffect, useState, useTransition } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  CheckCircle2,
  CircleDot,
  Flag,
  MessageSquare,
  Package,
  Paperclip,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ActivityLog, Comment, User } from '@/payload-types'
import { getInitials } from '@/lib/contact-display'
import { buildFeed, type ActivityNode, type CommentNode, type ReplyNode } from '@/lib/activity-feed'
import { addComment, deleteComment } from '@/app/(dashboard)/dashboard/projects/actions'
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar'
import { Button } from '@/components/dashboard/ui/button'
import { MentionInput, mentionLabel } from '@/components/dashboard/mention-input'

function personName(user: User | null): string {
  if (!user) return 'Someone'
  return user.name?.trim() || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Renders comment text with any `@Name` that matches a known staff member
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
    <span className="text-xs text-muted-foreground" title={format(date, "PPpp")}>
      {label}
    </span>
  )
}

const ACTIVITY_ICONS: Record<ActivityLog['type'], { Icon: LucideIcon; className: string }> = {
  'project-created': { Icon: Package, className: 'text-orange-500' },
  'status-changed': { Icon: CircleDot, className: 'text-blue-500' },
  'team-changed': { Icon: Users, className: 'text-purple-500' },
  'milestone-added': { Icon: Flag, className: 'text-muted-foreground' },
  'milestone-completed': { Icon: CheckCircle2, className: 'text-green-500' },
  'milestone-updated': { Icon: Flag, className: 'text-muted-foreground' },
  'resource-added': { Icon: Paperclip, className: 'text-muted-foreground' },
}

function CommentComposer({ projectId, staff }: { projectId: number; staff: User[] }) {
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
      await addComment(projectId, body, null, mentionIds)
      setDraft({ body: '', mentionIds: [] })
      setResetKey((key) => key + 1)
    })
  }

  return (
    <div className="rounded-lg border focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      <div className="px-4 py-3">
        <MentionInput
          key={resetKey}
          staff={staff}
          placeholder="Leave a comment... use @ to mention someone"
          className="min-h-16"
          onChange={(body, mentionIds) => setDraft({ body, mentionIds })}
        />
      </div>
      <div className="flex justify-end px-3 pt-2 pb-3">
        <Button size="sm" onClick={submit} disabled={!draft.body.trim() || isPending}>
          Comment
        </Button>
      </div>
    </div>
  )
}

function ReplyBox({
  projectId,
  parentId,
  staff,
}: {
  projectId: number
  parentId: number
  staff: User[]
}) {
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
      await addComment(projectId, body, parentId, mentionIds)
      setDraft({ body: '', mentionIds: [] })
      setResetKey((key) => key + 1)
    })
  }

  return (
    <div className="flex items-center gap-2 border-t px-3 py-2">
      <div className="min-w-0 flex-1">
        <MentionInput
          key={resetKey}
          staff={staff}
          singleLine
          placeholder="Leave a reply..."
          onChange={(body, mentionIds) => setDraft({ body, mentionIds })}
          onSubmit={submit}
        />
      </div>
      <Button size="sm" variant="ghost" onClick={submit} disabled={!draft.body.trim() || isPending}>
        Reply
      </Button>
    </div>
  )
}

function Reply({ reply, staff }: { reply: ReplyNode; staff: User[] }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2">
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback>{getInitials(reply.author?.firstName, reply.author?.lastName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{personName(reply.author)}</span>{' '}
          <RelativeTime iso={reply.createdAt} />
        </p>
        <p className="mt-0.5 text-sm whitespace-pre-wrap break-words">
          <MentionText text={reply.body} staff={staff} />
        </p>
      </div>
    </div>
  )
}

function CommentCard({
  comment,
  projectId,
  currentUser,
  staff,
}: {
  comment: CommentNode
  projectId: number
  currentUser: User
  staff: User[]
}) {
  const [isPending, startTransition] = useTransition()
  const canDelete =
    comment.author?.id === currentUser.id || Boolean(currentUser.roles?.includes('admin'))

  function handleDelete() {
    startTransition(async () => {
      await deleteComment(comment.id, projectId)
    })
  }

  return (
    <div className="rounded-lg border">
      <div className="group flex items-start gap-2 px-3 pt-3 pb-2">
        <Avatar size="sm" className="mt-0.5">
          <AvatarFallback>
            {getInitials(comment.author?.firstName, comment.author?.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium">{personName(comment.author)}</span>{' '}
            <RelativeTime iso={comment.createdAt} />
          </p>
          <p className="mt-0.5 text-sm whitespace-pre-wrap break-words">
            <MentionText text={comment.body} staff={staff} />
          </p>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Delete comment"
            onClick={handleDelete}
            disabled={isPending}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
      {comment.replies.length > 0 && (
        <div className="border-t">
          {comment.replies.map((reply) => (
            <Reply key={reply.id} reply={reply} staff={staff} />
          ))}
        </div>
      )}
      <ReplyBox projectId={projectId} parentId={comment.id} staff={staff} />
    </div>
  )
}

function ActivityRow({ node }: { node: ActivityNode }) {
  const { Icon, className } = ACTIVITY_ICONS[node.type]
  return (
    <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
      <Icon className={'size-4 shrink-0 ' + className} />
      <span className="min-w-0 truncate">
        <span className="font-medium text-foreground/80">{personName(node.actor)}</span> {node.summary}
      </span>
      <span className="text-muted-foreground/60">·</span>
      <RelativeTime iso={node.createdAt} />
    </div>
  )
}

export function ProjectActivity({
  projectId,
  currentUser,
  comments,
  activity,
  staff,
}: {
  projectId: number
  currentUser: User
  comments: Comment[]
  activity: ActivityLog[]
  staff: User[]
}) {
  const feed = buildFeed(comments, activity)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <CommentComposer projectId={projectId} staff={staff} />

      {feed.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No activity yet. Start the conversation above.
        </p>
      ) : (
        <div className="space-y-4">
          {feed.map((item) =>
            item.kind === 'comment' ? (
              <CommentCard
                key={`comment-${item.id}`}
                comment={item}
                projectId={projectId}
                currentUser={currentUser}
                staff={staff}
              />
            ) : (
              <ActivityRow key={`activity-${item.id}`} node={item} />
            ),
          )}
        </div>
      )}
    </div>
  )
}
