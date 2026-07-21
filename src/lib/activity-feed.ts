import type { Payload } from 'payload'
import type { ActivityLog, Comment, User } from '@/payload-types'

export interface ReplyNode {
  id: number
  createdAt: string
  author: User | null
  body: string
  mentions: number[]
}

export interface CommentNode {
  kind: 'comment'
  id: number
  createdAt: string
  author: User | null
  body: string
  mentions: number[]
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

function mentionIdsOf(comment: Comment): number[] {
  return (comment.mentions ?? []).map((mention) => (typeof mention === 'object' ? mention.id : mention))
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
      mentions: mentionIdsOf(comment),
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
      mentions: mentionIdsOf(comment),
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

export const PROJECT_ACTIVITY_PAGE_SIZE = 20

export interface ProjectActivityPage {
  /** Top-level comments on this page, plus ALL of their replies (unbounded),
   * so `buildFeed` can nest each thread in full regardless of page boundary. */
  comments: Comment[]
  activity: ActivityLog[]
  nextCursor: string | null
}

/** Fetches one page of a single project's Activity tab — top-level comments
 * and activity-log entries, newest first, merged and paginated together by
 * `createdAt` (mirrors `fetchGlobalActivityPage` in `inbox-activity.ts`, but
 * scoped to one project and returning raw docs so the caller can still run
 * them through `buildFeed`). Pass the previous page's `nextCursor` as
 * `before` to load older entries. */
export async function fetchProjectActivityPage(
  payload: Payload,
  user: User,
  projectId: number,
  before?: string | null,
): Promise<ProjectActivityPage> {
  const cursorFilter = before ? [{ createdAt: { less_than: before } }] : []

  const [{ docs: topComments }, { docs: activityDocs }] = await Promise.all([
    payload.find({
      collection: 'comments',
      where: { and: [{ project: { equals: projectId } }, { parent: { exists: false } }, ...cursorFilter] },
      user,
      overrideAccess: false,
      depth: 1,
      sort: '-createdAt',
      limit: PROJECT_ACTIVITY_PAGE_SIZE + 1,
    }),
    payload.find({
      collection: 'activity-log',
      where: { and: [{ project: { equals: projectId } }, ...cursorFilter] },
      user,
      overrideAccess: false,
      depth: 1,
      sort: '-createdAt',
      limit: PROJECT_ACTIVITY_PAGE_SIZE + 1,
    }),
  ])

  const candidates: Array<{ createdAt: string; comment?: Comment; activity?: ActivityLog }> = [
    ...topComments.map((doc) => ({ createdAt: doc.createdAt, comment: doc })),
    ...activityDocs.map((doc) => ({ createdAt: doc.createdAt, activity: doc })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const hasMore = candidates.length > PROJECT_ACTIVITY_PAGE_SIZE
  const page = candidates.slice(0, PROJECT_ACTIVITY_PAGE_SIZE)
  const nextCursor = hasMore ? page[page.length - 1].createdAt : null

  const pageComments = page.flatMap((c) => (c.comment ? [c.comment] : []))
  const pageActivity = page.flatMap((c) => (c.activity ? [c.activity] : []))

  const { docs: replies } =
    pageComments.length > 0
      ? await payload.find({
          collection: 'comments',
          where: { parent: { in: pageComments.map((c) => c.id) } },
          user,
          overrideAccess: false,
          depth: 1,
          sort: 'createdAt',
          limit: 0,
        })
      : { docs: [] as Comment[] }

  return {
    comments: [...pageComments, ...replies],
    activity: pageActivity,
    nextCursor,
  }
}
