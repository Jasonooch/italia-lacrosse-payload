import type { Payload } from 'payload'
import type { ActivityLog, Comment, Project, User } from '@/payload-types'

export interface InboxReplyItem {
  id: number
  createdAt: string
  authorName: string
  body: string
}

export interface InboxCommentItem {
  kind: 'comment'
  id: number
  createdAt: string
  authorName: string
  body: string
  projectId: number
  projectTitle: string
  replies: InboxReplyItem[]
}

export interface InboxActivityItem {
  kind: 'activity'
  id: number
  createdAt: string
  actorName: string
  type: ActivityLog['type']
  summary: string
  projectId: number
  projectTitle: string
}

export type InboxFeedItem = InboxCommentItem | InboxActivityItem

export interface InboxFeedPage {
  items: InboxFeedItem[]
  nextCursor: string | null
}

export const INBOX_ACTIVITY_PAGE_SIZE = 20

function personName(user: number | User | null | undefined): string {
  if (!user || typeof user !== 'object') return 'Someone'
  return user.name?.trim() || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
}

function projectOf(value: number | Project | null | undefined): { id: number; title: string } | null {
  if (value && typeof value === 'object') return { id: value.id, title: value.title }
  return null
}

function parentIdOf(comment: Comment): number | null {
  if (comment.parent == null) return null
  return typeof comment.parent === 'object' ? comment.parent.id : comment.parent
}

/** Fetches one page of the org-wide activity stream — every project's
 * comments and activity-log entries, newest first — for the inbox's "All
 * Activity" tab. Unlike "For You" this has no per-user read state; it's a
 * flat, read-only log you click through to the project to act on. Top-level
 * comments and activity entries are paginated together by `createdAt`;
 * replies are fetched in full for whichever top-level comments land on the
 * page, so a thread never shows up with its parent cut off. Pass the
 * previous page's `nextCursor` as `before` to load older entries. */
export async function fetchGlobalActivityPage(
  payload: Payload,
  user: User,
  before?: string | null,
): Promise<InboxFeedPage> {
  const cursorFilter = before ? [{ createdAt: { less_than: before } }] : []

  const [{ docs: topComments }, { docs: activityDocs }] = await Promise.all([
    payload.find({
      collection: 'comments',
      where: { and: [{ parent: { exists: false } }, ...cursorFilter] },
      user,
      overrideAccess: false,
      depth: 1,
      sort: '-createdAt',
      limit: INBOX_ACTIVITY_PAGE_SIZE + 1,
    }),
    payload.find({
      collection: 'activity-log',
      where: cursorFilter.length > 0 ? { and: cursorFilter } : {},
      user,
      overrideAccess: false,
      depth: 1,
      sort: '-createdAt',
      limit: INBOX_ACTIVITY_PAGE_SIZE + 1,
    }),
  ])

  const candidates: Array<{ createdAt: string; comment?: Comment; activity?: ActivityLog }> = [
    ...topComments.map((doc) => ({ createdAt: doc.createdAt, comment: doc })),
    ...activityDocs.map((doc) => ({ createdAt: doc.createdAt, activity: doc })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const hasMore = candidates.length > INBOX_ACTIVITY_PAGE_SIZE
  const page = candidates.slice(0, INBOX_ACTIVITY_PAGE_SIZE)
  const nextCursor = hasMore ? page[page.length - 1].createdAt : null

  const pageComments = page.flatMap((c) => (c.comment ? [c.comment] : []))

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

  const repliesByParent = new Map<number, InboxReplyItem[]>()
  for (const reply of replies) {
    const parentId = parentIdOf(reply)
    if (parentId == null) continue
    const list = repliesByParent.get(parentId) ?? []
    list.push({
      id: reply.id,
      createdAt: reply.createdAt,
      authorName: personName(reply.author),
      body: reply.body,
    })
    repliesByParent.set(parentId, list)
  }
  for (const list of repliesByParent.values()) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  const items: InboxFeedItem[] = page.map((c) => {
    if (c.comment) {
      const project = projectOf(c.comment.project)
      return {
        kind: 'comment',
        id: c.comment.id,
        createdAt: c.comment.createdAt,
        authorName: personName(c.comment.author),
        body: c.comment.body,
        projectId: project?.id ?? 0,
        projectTitle: project?.title ?? 'Unknown project',
        replies: repliesByParent.get(c.comment.id) ?? [],
      }
    }
    const entry = c.activity as ActivityLog
    const project = projectOf(entry.project)
    return {
      kind: 'activity',
      id: entry.id,
      createdAt: entry.createdAt,
      actorName: personName(entry.actor),
      type: entry.type,
      summary: entry.summary,
      projectId: project?.id ?? 0,
      projectTitle: project?.title ?? 'Unknown project',
    }
  })

  return { items, nextCursor }
}
