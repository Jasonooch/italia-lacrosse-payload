import type { Payload } from 'payload'
import type { Notification, Project, User } from '@/payload-types'

/** Owner + team member ids for a project, de-duplicated. */
export function projectMemberIds(project: Pick<Project, 'owner' | 'team'>): number[] {
  const ids = new Set<number>()
  const ownerId =
    project.owner == null ? null : typeof project.owner === 'object' ? project.owner.id : project.owner
  if (ownerId != null) ids.add(ownerId)
  for (const member of project.team ?? []) {
    ids.add(typeof member === 'object' ? member.id : member)
  }
  return [...ids]
}

/** Read notifications older than this are pruned opportunistically. */
const PRUNE_AFTER_DAYS = 30

interface NotifyInput {
  recipientIds: number[]
  type: Notification['type']
  projectId?: number | null
  contactId?: number | null
  summary: string
  commentId?: number | null
  contactNoteId?: number | null
}

/** Creates one inbox notification per recipient (the actor is always excluded —
 * you never get notified of your own action). Best-effort: failures are logged
 * and swallowed so notifications can't break the underlying action.
 *
 * Generic `project-activity` rows are de-duplicated: if a recipient already
 * has an unread one for the same project, no new row is created — a burst of
 * edits (add five milestones, reorder, change status) yields one inbox item
 * per member instead of a pile of near-identical rows. */
export async function notify(payload: Payload, actor: User, input: NotifyInput): Promise<void> {
  let recipients = [...new Set(input.recipientIds)].filter((id) => id !== actor.id)
  if (recipients.length === 0) return

  try {
    if (input.type === 'project-activity' && input.projectId != null) {
      // System-scoped read (recipients' rows aren't visible to the actor).
      const { docs: existing } = await payload.find({
        collection: 'notifications',
        where: {
          and: [
            { recipient: { in: recipients } },
            { project: { equals: input.projectId } },
            { type: { equals: 'project-activity' } },
            { read: { equals: false } },
          ],
        },
        overrideAccess: true,
        depth: 0,
        limit: 0,
        select: { recipient: true },
      })
      const alreadyNotified = new Set(
        existing.map((doc) => (typeof doc.recipient === 'object' ? doc.recipient.id : doc.recipient)),
      )
      recipients = recipients.filter((id) => !alreadyNotified.has(id))
    }

    await Promise.all(
      recipients.map((recipientId) =>
        payload
          .create({
            collection: 'notifications',
            data: {
              recipient: recipientId,
              type: input.type,
              project: input.projectId ?? null,
              contact: input.contactId ?? null,
              actor: actor.id,
              comment: input.commentId ?? null,
              contactNote: input.contactNoteId ?? null,
              summary: input.summary,
              read: false,
            },
            user: actor,
            overrideAccess: false,
          })
          .catch((error) => {
            payload.logger.error({ err: error, recipientId }, 'notify: failed to create notification')
          }),
      ),
    )

    await pruneReadNotifications(payload)
  } catch (error) {
    payload.logger.error({ err: error }, 'notify: failed')
  }
}

/** Deletes read notifications older than the retention window so the table
 * doesn't grow forever. Piggybacks on `notify` (system-scoped, best-effort)
 * rather than needing a cron. */
async function pruneReadNotifications(payload: Payload): Promise<void> {
  const cutoff = new Date(Date.now() - PRUNE_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString()
  try {
    await payload.delete({
      collection: 'notifications',
      where: {
        and: [{ read: { equals: true } }, { createdAt: { less_than: cutoff } }],
      },
      overrideAccess: true,
    })
  } catch (error) {
    payload.logger.error({ err: error }, 'notify: failed to prune read notifications')
  }
}
