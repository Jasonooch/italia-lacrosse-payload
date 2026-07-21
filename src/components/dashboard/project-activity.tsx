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
  Pencil,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ActivityLog, Comment, User } from '@/payload-types'
import { getInitials } from '@/lib/contact-display'
import { buildFeed, type ActivityNode, type CommentNode, type ReplyNode } from '@/lib/activity-feed'
import {
  addComment,
  deleteComment,
  editComment,
  loadMoreProjectActivity,
} from '@/app/(dashboard)/dashboard/projects/actions'
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar'
import { Button } from '@/components/dashboard/ui/button'
import { MentionInput } from '@/components/dashboard/mention-input'
import { MentionText } from '@/lib/render-mention-text'

function personName(user: User | null): string {
  if (!user) return 'Someone'
  return user.name?.trim() || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
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
    <div className="rounded-lg border bg-card shadow-sm focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
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

function Reply({
  reply,
  projectId,
  currentUser,
  staff,
}: {
  reply: ReplyNode
  projectId: number
  currentUser: User
  staff: User[]
}) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<{ body: string; mentionIds: number[] }>({
    body: reply.body,
    mentionIds: reply.mentions,
  })
  const isAuthor = reply.author?.id === currentUser.id
  const canDelete = isAuthor || Boolean(currentUser.roles?.includes('admin'))

  function handleDelete() {
    startTransition(async () => {
      await deleteComment(reply.id, projectId)
    })
  }

  function startEdit() {
    setEditDraft({ body: reply.body, mentionIds: reply.mentions })
    setIsEditing(true)
  }

  function handleSaveEdit() {
    if (!editDraft.body.trim()) return
    startTransition(async () => {
      await editComment(reply.id, projectId, editDraft.body, editDraft.mentionIds)
      setIsEditing(false)
    })
  }

  return (
    <div className="group flex items-start gap-2 py-2 pr-3 pl-8">
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback>{getInitials(reply.author?.firstName, reply.author?.lastName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{personName(reply.author)}</span>{' '}
          <RelativeTime iso={reply.createdAt} />
        </p>
        {isEditing ? (
          <div className="mt-1">
            <MentionInput
              staff={staff}
              initialValue={reply.body}
              initialMentionIds={reply.mentions}
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
            <MentionText text={reply.body} staff={staff} />
          </p>
        )}
      </div>
      {!isEditing && (isAuthor || canDelete) && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100">
          {isAuthor && (
            <Button variant="ghost" size="icon-xs" aria-label="Edit reply" onClick={startEdit}>
              <Pencil className="size-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Delete reply"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      )}
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
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<{ body: string; mentionIds: number[] }>({
    body: comment.body,
    mentionIds: comment.mentions,
  })
  const isAuthor = comment.author?.id === currentUser.id
  const canDelete = isAuthor || Boolean(currentUser.roles?.includes('admin'))

  function handleDelete() {
    startTransition(async () => {
      await deleteComment(comment.id, projectId)
    })
  }

  function startEdit() {
    setEditDraft({ body: comment.body, mentionIds: comment.mentions })
    setIsEditing(true)
  }

  function handleSaveEdit() {
    if (!editDraft.body.trim()) return
    startTransition(async () => {
      await editComment(comment.id, projectId, editDraft.body, editDraft.mentionIds)
      setIsEditing(false)
    })
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
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
          {isEditing ? (
            <div className="mt-1">
              <MentionInput
                staff={staff}
                initialValue={comment.body}
                initialMentionIds={comment.mentions}
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
              <MentionText text={comment.body} staff={staff} />
            </p>
          )}
        </div>
        {!isEditing && (isAuthor || canDelete) && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100">
            {isAuthor && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Edit comment"
                onClick={startEdit}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Delete comment"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
      {comment.replies.length > 0 && (
        <div className="border-t">
          {comment.replies.map((reply) => (
            <Reply
              key={reply.id}
              reply={reply}
              projectId={projectId}
              currentUser={currentUser}
              staff={staff}
            />
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
  initialComments,
  initialActivity,
  initialCursor,
  staff,
}: {
  projectId: number
  currentUser: User
  initialComments: Comment[]
  initialActivity: ActivityLog[]
  initialCursor: string | null
  staff: User[]
}) {
  const [cursor, setCursor] = useState(initialCursor)
  const [olderComments, setOlderComments] = useState<Comment[]>([])
  const [olderActivity, setOlderActivity] = useState<ActivityLog[]>([])
  const [isLoadingMore, startLoadMore] = useTransition()

  // First page comes straight from server props, so it stays live across
  // add/edit/delete (each triggers revalidatePath, refreshing these props).
  // Older pages are appended client-side and won't reflect edits/deletes made
  // to them after loading — an accepted tradeoff, same as the inbox feed.
  const feed = [...buildFeed(initialComments, initialActivity), ...buildFeed(olderComments, olderActivity)]

  function loadMore() {
    if (!cursor) return
    startLoadMore(async () => {
      const next = await loadMoreProjectActivity(projectId, cursor)
      setOlderComments((prev) => [...prev, ...next.comments])
      setOlderActivity((prev) => [...prev, ...next.activity])
      setCursor(next.nextCursor)
    })
  }

  return (
    <div className="space-y-4">
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

      {cursor && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}
