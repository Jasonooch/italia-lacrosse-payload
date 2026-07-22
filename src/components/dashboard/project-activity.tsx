'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { getInitials } from '@/lib/contact-display'
import { staffName, type StaffUser } from '@/lib/staff'
import {
  buildFeed,
  type ActivityNode,
  type CommentNode,
  type FeedActivity,
  type FeedComment,
  type ReplyNode,
} from '@/lib/activity-feed'
import {
  addComment,
  deleteComment,
  editComment,
  loadMoreProjectActivity,
} from '@/app/(dashboard)/dashboard/projects/actions'
import { ACTIVITY_ICONS } from '@/components/dashboard/activity-icons'
import { RelativeTime } from '@/components/dashboard/relative-time'
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar'
import { Button } from '@/components/dashboard/ui/button'
import { MentionInput } from '@/components/dashboard/mention-input'
import { MentionText } from '@/lib/render-mention-text'

function ActionError({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

function CommentComposer({ projectId, staff }: { projectId: number; staff: StaffUser[] }) {
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
      const result = await addComment(projectId, body, null, mentionIds)
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
    <div className="rounded-lg border bg-card shadow-sm focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      <div className="px-4 py-3">
        <MentionInput
          key={resetKey}
          staff={staff}
          placeholder="Leave a comment... use @ to mention someone"
          className="min-h-16"
          onChange={(body, mentionIds) => setDraft({ body, mentionIds })}
        />
        <ActionError message={error} />
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
  staff: StaffUser[]
}) {
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
      const result = await addComment(projectId, body, parentId, mentionIds)
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
    <div className="border-t px-3 py-2">
      <div className="flex items-center gap-2">
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
      <ActionError message={error} />
    </div>
  )
}

/** Shared edit/delete affordances for a comment or reply. */
function useCommentActions(projectId: number, id: number, body: string, mentions: number[]) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ body: string; mentionIds: number[] }>({
    body,
    mentionIds: mentions,
  })

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteComment(id, projectId)
      setError(result.ok ? null : result.error)
    })
  }

  function startEdit() {
    setEditDraft({ body, mentionIds: mentions })
    setError(null)
    setIsEditing(true)
  }

  function handleSaveEdit() {
    if (!editDraft.body.trim()) return
    startTransition(async () => {
      const result = await editComment(id, projectId, editDraft.body, editDraft.mentionIds)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setError(null)
      setIsEditing(false)
    })
  }

  return {
    isPending,
    isEditing,
    setIsEditing,
    error,
    editDraft,
    setEditDraft,
    handleDelete,
    startEdit,
    handleSaveEdit,
  }
}

function CommentBody({
  isEditing,
  body,
  mentions,
  staff,
  actions,
}: {
  isEditing: boolean
  body: string
  mentions: number[]
  staff: StaffUser[]
  actions: ReturnType<typeof useCommentActions>
}) {
  if (!isEditing) {
    return (
      <>
        <p className="mt-0.5 text-sm whitespace-pre-wrap break-words">
          <MentionText text={body} staff={staff} />
        </p>
        <ActionError message={actions.error} />
      </>
    )
  }
  return (
    <div className="mt-1">
      <MentionInput
        staff={staff}
        initialValue={body}
        initialMentionIds={mentions}
        className="min-h-16"
        onChange={(nextBody, mentionIds) => actions.setEditDraft({ body: nextBody, mentionIds })}
      />
      <ActionError message={actions.error} />
      <div className="mt-2 flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => actions.setIsEditing(false)}
          disabled={actions.isPending}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={actions.handleSaveEdit}
          disabled={!actions.editDraft.body.trim() || actions.isPending}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

function EditDeleteButtons({
  label,
  isAuthor,
  canDelete,
  actions,
}: {
  label: 'comment' | 'reply'
  isAuthor: boolean
  canDelete: boolean
  actions: ReturnType<typeof useCommentActions>
}) {
  if (!isAuthor && !canDelete) return null
  return (
    <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100">
      {isAuthor && (
        <Button variant="ghost" size="icon-xs" aria-label={`Edit ${label}`} onClick={actions.startEdit}>
          <Pencil className="size-3.5" />
        </Button>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Delete ${label}`}
          onClick={actions.handleDelete}
          disabled={actions.isPending}
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

function Reply({
  reply,
  projectId,
  currentUserId,
  isAdmin,
  staff,
}: {
  reply: ReplyNode
  projectId: number
  currentUserId: number
  isAdmin: boolean
  staff: StaffUser[]
}) {
  const actions = useCommentActions(projectId, reply.id, reply.body, reply.mentions)
  const isAuthor = reply.author?.id === currentUserId
  const canDelete = isAuthor || isAdmin

  return (
    <div className="group flex items-start gap-2 py-2 pr-3 pl-8">
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback>{getInitials(reply.author?.firstName, reply.author?.lastName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{staffName(reply.author)}</span>{' '}
          <RelativeTime iso={reply.createdAt} />
        </p>
        <CommentBody
          isEditing={actions.isEditing}
          body={reply.body}
          mentions={reply.mentions}
          staff={staff}
          actions={actions}
        />
      </div>
      {!actions.isEditing && (
        <EditDeleteButtons label="reply" isAuthor={isAuthor} canDelete={canDelete} actions={actions} />
      )}
    </div>
  )
}

function CommentCard({
  comment,
  projectId,
  currentUserId,
  isAdmin,
  staff,
}: {
  comment: CommentNode
  projectId: number
  currentUserId: number
  isAdmin: boolean
  staff: StaffUser[]
}) {
  const actions = useCommentActions(projectId, comment.id, comment.body, comment.mentions)
  const isAuthor = comment.author?.id === currentUserId
  const canDelete = isAuthor || isAdmin

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
            <span className="font-medium">{staffName(comment.author)}</span>{' '}
            <RelativeTime iso={comment.createdAt} />
          </p>
          <CommentBody
            isEditing={actions.isEditing}
            body={comment.body}
            mentions={comment.mentions}
            staff={staff}
            actions={actions}
          />
        </div>
        {!actions.isEditing && (
          <EditDeleteButtons
            label="comment"
            isAuthor={isAuthor}
            canDelete={canDelete}
            actions={actions}
          />
        )}
      </div>
      {comment.replies.length > 0 && (
        <div className="border-t">
          {comment.replies.map((reply) => (
            <Reply
              key={reply.id}
              reply={reply}
              projectId={projectId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
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
        <span className="font-medium text-foreground/80">{staffName(node.actor)}</span> {node.summary}
      </span>
      <span className="text-muted-foreground/60">·</span>
      <RelativeTime iso={node.createdAt} />
    </div>
  )
}

export function ProjectActivity({
  projectId,
  currentUserId,
  isAdmin,
  initialComments,
  initialActivity,
  initialCursor,
  staff,
}: {
  projectId: number
  currentUserId: number
  isAdmin: boolean
  initialComments: FeedComment[]
  initialActivity: FeedActivity[]
  initialCursor: string | null
  staff: StaffUser[]
}) {
  const [cursor, setCursor] = useState(initialCursor)
  const [olderComments, setOlderComments] = useState<FeedComment[]>([])
  const [olderActivity, setOlderActivity] = useState<FeedActivity[]>([])
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
      // The cursor is inclusive, so the boundary item comes back again — drop
      // anything already shown before appending.
      const seenComments = new Set([...initialComments, ...olderComments].map((c) => c.id))
      const seenActivity = new Set([...initialActivity, ...olderActivity].map((a) => a.id))
      const newComments = next.comments.filter((c) => !seenComments.has(c.id))
      const newActivity = next.activity.filter((a) => !seenActivity.has(a.id))
      setOlderComments((prev) => [...prev, ...newComments])
      setOlderActivity((prev) => [...prev, ...newActivity])
      // If a page produced nothing new and the cursor didn't advance, we're at
      // the end — stop rather than looping on the same timestamp.
      if (next.nextCursor === cursor && newComments.length === 0 && newActivity.length === 0) {
        setCursor(null)
      } else {
        setCursor(next.nextCursor)
      }
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
                currentUserId={currentUserId}
                isAdmin={isAdmin}
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
