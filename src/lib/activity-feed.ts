import type { ActivityLog, Comment, User } from '@/payload-types'

export interface ReplyNode {
  id: number
  createdAt: string
  author: User | null
  body: string
}

export interface CommentNode {
  kind: 'comment'
  id: number
  createdAt: string
  author: User | null
  body: string
  replies: ReplyNode[]
}

export interface ActivityNode {
  kind: 'activity'
  id: number
  createdAt: string
  actor: User | null
  type: ActivityLog['type']
  summary: string
}

export type FeedItem = CommentNode | ActivityNode

function asUser(value: number | User | null | undefined): User | null {
  return value && typeof value === 'object' ? value : null
}

function parentIdOf(comment: Comment): number | null {
  if (comment.parent == null) return null
  return typeof comment.parent === 'object' ? comment.parent.id : comment.parent
}

/** Merges comments and activity entries into one feed sorted newest-first.
 * Comments with a `parent` are nested as one-level replies under their parent
 * (oldest-first within a thread, like a conversation); activity entries and
 * top-level comments interleave by `createdAt`. */
export function buildFeed(comments: Comment[], activity: ActivityLog[]): FeedItem[] {
  const repliesByParent = new Map<number, ReplyNode[]>()
  for (const comment of comments) {
    const parentId = parentIdOf(comment)
    if (parentId == null) continue
    const list = repliesByParent.get(parentId) ?? []
    list.push({
      id: comment.id,
      createdAt: comment.createdAt,
      author: asUser(comment.author),
      body: comment.body,
    })
    repliesByParent.set(parentId, list)
  }
  for (const list of repliesByParent.values()) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  const commentNodes: CommentNode[] = comments
    .filter((comment) => parentIdOf(comment) == null)
    .map((comment) => ({
      kind: 'comment',
      id: comment.id,
      createdAt: comment.createdAt,
      author: asUser(comment.author),
      body: comment.body,
      replies: repliesByParent.get(comment.id) ?? [],
    }))

  const activityNodes: ActivityNode[] = activity.map((entry) => ({
    kind: 'activity',
    id: entry.id,
    createdAt: entry.createdAt,
    actor: asUser(entry.actor),
    type: entry.type,
    summary: entry.summary,
  }))

  return [...commentNodes, ...activityNodes].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
}
