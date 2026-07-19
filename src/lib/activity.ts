import type { Payload } from 'payload'
import type { ActivityLog, User } from '@/payload-types'
import { notify, projectMemberIds } from '@/lib/notifications'

export type ActivityType = ActivityLog['type']

/** Records one entry on a project's activity feed AND fans out an inbox
 * notification to every project member (owner + team, minus the actor).
 * Best-effort: a logging failure is swallowed so it can never break the user's
 * actual action. Call from inside the project server actions, which know the
 * precise semantics ("status changed" vs "milestone reordered") a generic hook
 * would lose. */
export async function logActivity(
  payload: Payload,
  actor: User,
  projectId: number,
  type: ActivityType,
  summary: string,
): Promise<void> {
  try {
    await payload.create({
      collection: 'activity-log',
      data: { project: projectId, actor: actor.id, type, summary },
      user: actor,
      overrideAccess: false,
    })

    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      user: actor,
      overrideAccess: false,
      depth: 0,
      disableErrors: true,
    })
    if (project) {
      await notify(payload, actor, {
        recipientIds: projectMemberIds(project),
        type: 'project-activity',
        projectId,
        summary,
      })
    }
  } catch {
    // Intentionally ignored — see doc comment.
  }
}

/** Full name for an activity summary, falling back to email. */
export function actorName(user: Pick<User, 'name' | 'email'>): string {
  return user.name?.trim() || user.email
}
