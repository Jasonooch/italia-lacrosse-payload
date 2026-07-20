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
 * you never get notified of your own action). Best-effort: a failed row is
 * swallowed so notifications can't break the underlying action. */
export async function notify(payload: Payload, actor: User, input: NotifyInput): Promise<void> {
  const recipients = [...new Set(input.recipientIds)].filter((id) => id !== actor.id)
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
        .catch(() => {
          // Intentionally ignored — see doc comment.
        }),
    ),
  )
}
