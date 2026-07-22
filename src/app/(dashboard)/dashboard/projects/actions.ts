'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireDashboardUser } from '@/lib/auth'
import type { Project } from '@/payload-types'
import { ACTION_FAILED, type ActionResult } from '@/lib/action-result'
import {
  PROJECT_STATUS_LABELS,
  type MilestoneStatus,
  type ProjectStatus,
} from '@/lib/project-display'
import { actorName, logActivity } from '@/lib/activity'
import { fetchProjectActivityPage } from '@/lib/activity-feed'
import { notify, projectMemberIds } from '@/lib/notifications'

export interface ProjectFormInput {
  title: string
  description?: string | null
  status: ProjectStatus
  startDate?: string | null
  dueDate?: string | null
  tournament?: number | null
  owner?: number | null
  team?: number[]
}

function toProjectData(input: ProjectFormInput) {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: input.status,
    startDate: input.startDate || null,
    dueDate: input.dueDate || null,
    tournament: input.tournament || null,
    owner: input.owner || null,
    team: input.team ?? [],
  }
}

export async function createProject(input: ProjectFormInput) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const created = await payload.create({
    collection: 'projects',
    data: toProjectData(input),
    user,
    overrideAccess: false,
  })

  await logActivity(payload, user, created.id, 'project-created', 'created the project')

  revalidatePath('/dashboard/projects')
  redirect(`/dashboard/projects/${created.id}`)
}

export async function updateProject(projectId: number, input: ProjectFormInput) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  await payload.update({
    collection: 'projects',
    id: projectId,
    data: toProjectData(input),
    user,
    overrideAccess: false,
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
  redirect(`/dashboard/projects/${projectId}`)
}

function resourceFileId(resource: NonNullable<Project['resources']>[number]): number | null {
  if (resource.file == null) return null
  return typeof resource.file === 'object' ? resource.file.id : resource.file
}

export async function deleteProject(projectId: number) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  // Snapshot the resource file ids before the project (and its resources
  // array) goes away, so the underlying uploads can be cleaned up too.
  const project = await payload.findByID({
    collection: 'projects',
    id: projectId,
    user,
    overrideAccess: false,
    depth: 0,
    disableErrors: true,
  })
  const fileIds = (project?.resources ?? [])
    .map(resourceFileId)
    .filter((id): id is number => id != null)

  await payload.delete({
    collection: 'projects',
    id: projectId,
    user,
    overrideAccess: false,
  })

  // Cascade: remove everything that pointed at the project so the inbox and
  // activity feeds don't fill with orphaned "Unknown project" entries, and R2
  // doesn't keep the project's uploads forever. System-scoped
  // (overrideAccess) because the rows being cleaned up — other people's
  // comments and notifications — are deliberately not writable by this user;
  // the authorization gate was the project delete above. Best-effort: the
  // project itself is already gone.
  try {
    await payload.delete({
      collection: 'comments',
      where: { project: { equals: projectId } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'activity-log',
      where: { project: { equals: projectId } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'notifications',
      where: { project: { equals: projectId } },
      overrideAccess: true,
    })
    for (const fileId of fileIds) {
      await payload.delete({ collection: 'project-files', id: fileId, overrideAccess: true })
    }
  } catch (error) {
    payload.logger.error({ err: error, projectId }, 'deleteProject: cascade cleanup failed')
  }

  revalidatePath('/dashboard/projects')
  redirect('/dashboard/projects')
}

export async function updateMilestoneStatus(
  projectId: number,
  milestoneId: string,
  status: MilestoneStatus,
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  try {
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      depth: 0,
    })

    const target = (project.milestones ?? []).find((milestone) => milestone.id === milestoneId)
    const milestones = (project.milestones ?? []).map((milestone) =>
      milestone.id === milestoneId ? { ...milestone, status } : milestone,
    )

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { milestones },
      user,
      overrideAccess: false,
    })

    // Only completions make the feed — reopening or nudging back to "in progress"
    // is noise. `target` is looked up pre-update so we have the milestone title.
    if (target && status === 'completed' && target.status !== 'completed') {
      await logActivity(
        payload,
        user,
        projectId,
        'milestone-completed',
        `completed milestone “${target.title}”`,
      )
    }
  } catch (error) {
    payload.logger.error({ err: error, projectId, milestoneId }, 'updateMilestoneStatus: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
  return { ok: true }
}

/** Payload's `team` relationship is stored as ids or populated docs depending on
 * depth; normalize to plain ids before writing back. */
function toUserIds(team: Project['team']) {
  return (team ?? []).map((member) => (typeof member === 'object' ? member.id : member))
}

export async function addTeamMember(projectId: number, userId: number): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  try {
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      depth: 0,
    })

    const currentIds = toUserIds(project.team)
    if (!currentIds.includes(userId)) {
      await payload.update({
        collection: 'projects',
        id: projectId,
        data: { team: [...currentIds, userId] },
        user,
        overrideAccess: false,
      })

      const member = await payload.findByID({
        collection: 'users',
        id: userId,
        user,
        overrideAccess: false,
        disableErrors: true,
      })
      if (member) {
        await logActivity(payload, user, projectId, 'team-changed', `added ${actorName(member)} to the team`)
      }
    }
  } catch (error) {
    payload.logger.error({ err: error, projectId, userId }, 'addTeamMember: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
  return { ok: true }
}

export async function removeTeamMember(projectId: number, userId: number): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  try {
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      depth: 0,
    })

    const nextIds = toUserIds(project.team).filter((id) => id !== userId)

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { team: nextIds },
      user,
      overrideAccess: false,
    })

    const member = await payload.findByID({
      collection: 'users',
      id: userId,
      user,
      overrideAccess: false,
      disableErrors: true,
    })
    if (member) {
      await logActivity(
        payload,
        user,
        projectId,
        'team-changed',
        `removed ${actorName(member)} from the team`,
      )
    }
  } catch (error) {
    payload.logger.error({ err: error, projectId, userId }, 'removeTeamMember: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
  return { ok: true }
}

export async function updateProjectStatus(
  projectId: number,
  status: ProjectStatus,
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  try {
    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { status },
      user,
      overrideAccess: false,
    })

    await logActivity(
      payload,
      user,
      projectId,
      'status-changed',
      `changed status to ${PROJECT_STATUS_LABELS[status]}`,
    )
  } catch (error) {
    payload.logger.error({ err: error, projectId, status }, 'updateProjectStatus: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
  return { ok: true }
}

export interface MilestoneInput {
  title: string
  dueDate?: string | null
  assignee?: number | null
}

export async function addMilestone(projectId: number, input: MilestoneInput): Promise<ActionResult> {
  const user = await requireDashboardUser()
  if (!input.title.trim()) return { ok: false, error: 'A milestone needs a title.' }
  const payload = await getPayload({ config })

  try {
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      depth: 0,
    })

    const milestones = [
      ...(project.milestones ?? []),
      {
        title: input.title.trim(),
        status: 'not-started' as const,
        dueDate: input.dueDate || null,
        assignee: input.assignee || null,
      },
    ]

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { milestones },
      user,
      overrideAccess: false,
    })

    await logActivity(payload, user, projectId, 'milestone-added', `added milestone “${input.title}”`)
  } catch (error) {
    payload.logger.error({ err: error, projectId }, 'addMilestone: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
  return { ok: true }
}

export async function updateMilestone(
  projectId: number,
  milestoneId: string,
  input: MilestoneInput,
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  if (!input.title.trim()) return { ok: false, error: 'A milestone needs a title.' }
  const payload = await getPayload({ config })

  try {
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      depth: 0,
    })

    const milestones = (project.milestones ?? []).map((milestone) =>
      milestone.id === milestoneId
        ? {
            ...milestone,
            title: input.title.trim(),
            dueDate: input.dueDate || null,
            assignee: input.assignee || null,
          }
        : milestone,
    )

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { milestones },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    payload.logger.error({ err: error, projectId, milestoneId }, 'updateMilestone: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
  return { ok: true }
}

export async function deleteMilestone(projectId: number, milestoneId: string): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  try {
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      depth: 0,
    })

    const removed = (project.milestones ?? []).find((milestone) => milestone.id === milestoneId)
    const milestones = (project.milestones ?? []).filter(
      (milestone) => milestone.id !== milestoneId,
    )

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { milestones },
      user,
      overrideAccess: false,
    })

    if (removed) {
      await logActivity(
        payload,
        user,
        projectId,
        'milestone-updated',
        `removed milestone “${removed.title}”`,
      )
    }
  } catch (error) {
    payload.logger.error({ err: error, projectId, milestoneId }, 'deleteMilestone: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
  return { ok: true }
}

async function uploadProjectFile(
  payload: Payload,
  user: Awaited<ReturnType<typeof requireDashboardUser>>,
  file: File,
): Promise<number> {
  const uploaded = await payload.create({
    collection: 'project-files',
    data: {},
    file: {
      data: Buffer.from(await file.arrayBuffer()),
      mimetype: file.type,
      name: file.name,
      size: file.size,
    },
    user,
    overrideAccess: false,
  })
  return uploaded.id
}

/** Adds a resource from a FormData payload: `title` plus either a `url` string
 * or an uploaded `file`. Files land in the staff-only `project-files`
 * collection and are linked from the project's resources array. */
export async function addProjectResource(
  projectId: number,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { ok: false, error: 'A resource needs a title.' }

  const url = String(formData.get('url') ?? '').trim()
  const file = formData.get('file')
  if (!url && !(file instanceof File && file.size > 0)) {
    return { ok: false, error: 'Add a link or attach a file.' }
  }

  try {
    let fileId: number | null = null
    if (file instanceof File && file.size > 0) {
      fileId = await uploadProjectFile(payload, user, file)
    }

    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      depth: 0,
    })

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: {
        resources: [
          ...(project.resources ?? []),
          { title, url: url || null, file: fileId },
        ],
      },
      user,
      overrideAccess: false,
    })

    await logActivity(payload, user, projectId, 'resource-added', `added resource “${title}”`)
  } catch (error) {
    payload.logger.error({ err: error, projectId }, 'addProjectResource: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

/** Edits a resource in place: `title` always updates; a new `file` or a
 * non-empty `url` replaces the existing source (and deletes the old upload,
 * if any), while leaving both blank keeps the current source untouched. */
export async function editProjectResource(
  projectId: number,
  resourceId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { ok: false, error: 'A resource needs a title.' }

  const url = String(formData.get('url') ?? '').trim()
  const file = formData.get('file')

  try {
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      depth: 0,
    })

    const existing = (project.resources ?? []).find((resource) => resource.id === resourceId)
    if (!existing) return { ok: false, error: 'That resource no longer exists.' }

    const existingFileId = resourceFileId(existing)

    let fileId = existingFileId
    let nextUrl = existing.url ?? null
    let staleFileId: number | null = null

    if (file instanceof File && file.size > 0) {
      fileId = await uploadProjectFile(payload, user, file)
      nextUrl = null
      staleFileId = existingFileId
    } else if (url && url !== (existing.url ?? '')) {
      fileId = null
      nextUrl = url
      staleFileId = existingFileId
    }

    const resources = (project.resources ?? []).map((resource) =>
      resource.id === resourceId ? { ...resource, title, url: nextUrl, file: fileId } : resource,
    )

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { resources },
      user,
      overrideAccess: false,
    })

    if (staleFileId != null) {
      try {
        await payload.delete({
          collection: 'project-files',
          id: staleFileId,
          user,
          overrideAccess: false,
        })
      } catch (error) {
        // The resource itself already updated; a failed cleanup shouldn't surface.
        payload.logger.error({ err: error, staleFileId }, 'editProjectResource: file cleanup failed')
      }
    }
  } catch (error) {
    payload.logger.error({ err: error, projectId, resourceId }, 'editProjectResource: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function deleteProjectResource(
  projectId: number,
  resourceId: string,
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  try {
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      depth: 0,
    })

    const removed = (project.resources ?? []).find((resource) => resource.id === resourceId)
    const resources = (project.resources ?? []).filter((resource) => resource.id !== resourceId)

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { resources },
      user,
      overrideAccess: false,
    })

    // Clean up the underlying upload so R2 doesn't accumulate orphans. Resources
    // own their files one-to-one, so this can't strand another reference.
    const removedFileId = removed ? resourceFileId(removed) : null
    if (removedFileId != null) {
      try {
        await payload.delete({
          collection: 'project-files',
          id: removedFileId,
          user,
          overrideAccess: false,
        })
      } catch (error) {
        // The resource itself is gone; a failed file cleanup shouldn't surface.
        payload.logger.error({ err: error, removedFileId }, 'deleteProjectResource: file cleanup failed')
      }
    }
  } catch (error) {
    payload.logger.error({ err: error, projectId, resourceId }, 'deleteProjectResource: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

/** Persist a new milestone order. `orderedIds` must be a pure permutation of
 * the stored milestone ids — anything else (stale client, duplicated or
 * missing ids) is rejected so a mismatched payload can't corrupt the array. */
export async function reorderMilestones(
  projectId: number,
  orderedIds: string[],
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  try {
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      depth: 0,
    })

    const current = project.milestones ?? []
    const byId = new Map(current.map((milestone) => [milestone.id, milestone]))
    const uniqueIds = new Set(orderedIds)

    const isPermutation =
      uniqueIds.size === orderedIds.length &&
      orderedIds.length === current.length &&
      orderedIds.every((id) => byId.has(id))
    if (!isPermutation) {
      return { ok: false, error: 'The milestone list changed — refresh and try again.' }
    }

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { milestones: orderedIds.map((id) => byId.get(id)!) },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    payload.logger.error({ err: error, projectId }, 'reorderMilestones: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
  return { ok: true }
}

/** Post a comment on a project's Activity tab. Pass `parentId` to make it a
 * one-level reply, and `mentionIds` for staff @-mentioned in the body — each
 * mentioned person gets a 'mention' inbox notification; other project members
 * get a 'comment' one. */
export async function addComment(
  projectId: number,
  body: string,
  parentId?: number | null,
  mentionIds: number[] = [],
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const trimmed = body.trim()
  if (!trimmed) return { ok: false, error: 'A comment needs some text.' }

  const payload = await getPayload({ config })

  const uniqueMentions = [...new Set(mentionIds)]

  try {
    const comment = await payload.create({
      collection: 'comments',
      data: {
        project: projectId,
        author: user.id,
        body: trimmed,
        parent: parentId ?? null,
        mentions: uniqueMentions,
      },
      user,
      overrideAccess: false,
    })

    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      user,
      overrideAccess: false,
      depth: 0,
      disableErrors: true,
    })

    if (project) {
      // Mentioned people get a mention; remaining project members get a plain
      // comment notification (a mention takes precedence — no double-notifying).
      await notify(payload, user, {
        recipientIds: uniqueMentions,
        type: 'mention',
        projectId,
        commentId: comment.id,
        summary: `mentioned you in ${project.title}`,
      })
      const others = projectMemberIds(project).filter((id) => !uniqueMentions.includes(id))
      await notify(payload, user, {
        recipientIds: others,
        type: 'comment',
        projectId,
        commentId: comment.id,
        summary: `commented on ${project.title}`,
      })
    }
  } catch (error) {
    payload.logger.error({ err: error, projectId }, 'addComment: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

/** Edit a comment's body/mentions. Only the author may edit their own (unlike
 * delete, editing is not extended to admins — an "edited" comment still reads
 * as the author's words). Staff newly @-mentioned by the edit are notified. */
export async function editComment(
  commentId: number,
  projectId: number,
  body: string,
  mentionIds: number[] = [],
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const trimmed = body.trim()
  if (!trimmed) return { ok: false, error: 'A comment needs some text.' }

  const payload = await getPayload({ config })

  try {
    const comment = await payload.findByID({
      collection: 'comments',
      id: commentId,
      user,
      overrideAccess: false,
      depth: 0,
      disableErrors: true,
    })

    if (!comment) return { ok: false, error: 'That comment no longer exists.' }
    const authorId = typeof comment.author === 'object' ? comment.author.id : comment.author
    if (authorId !== user.id) return { ok: false, error: 'Only the author can edit a comment.' }

    const uniqueMentions = [...new Set(mentionIds)]

    await payload.update({
      collection: 'comments',
      id: commentId,
      data: { body: trimmed, mentions: uniqueMentions },
      user,
      overrideAccess: false,
    })

    // Anyone @-mentioned for the first time by this edit still deserves a ping.
    const previousMentions = new Set(
      (comment.mentions ?? []).map((mention) => (typeof mention === 'object' ? mention.id : mention)),
    )
    const addedMentions = uniqueMentions.filter((id) => !previousMentions.has(id))
    if (addedMentions.length > 0) {
      const project = await payload.findByID({
        collection: 'projects',
        id: projectId,
        user,
        overrideAccess: false,
        depth: 0,
        disableErrors: true,
      })
      if (project) {
        await notify(payload, user, {
          recipientIds: addedMentions,
          type: 'mention',
          projectId,
          commentId,
          summary: `mentioned you in ${project.title}`,
        })
      }
    }
  } catch (error) {
    payload.logger.error({ err: error, commentId }, 'editComment: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

/** Loads the next page of a project's Activity tab, older than `before`. */
export async function loadMoreProjectActivity(projectId: number, before: string) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })
  return fetchProjectActivityPage(payload, user, projectId, before)
}

/** Delete a comment. Only the author or an admin may remove it. Replies and
 * notifications hanging off the comment are cascaded so they don't resurface
 * as orphaned top-level comments or dead inbox links. */
export async function deleteComment(commentId: number, projectId: number): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  try {
    const comment = await payload.findByID({
      collection: 'comments',
      id: commentId,
      user,
      overrideAccess: false,
      depth: 0,
      disableErrors: true,
    })

    if (!comment) return { ok: false, error: 'That comment no longer exists.' }
    const authorId = typeof comment.author === 'object' ? comment.author.id : comment.author
    const isAdmin = user.roles?.includes('admin')
    if (authorId !== user.id && !isAdmin) {
      return { ok: false, error: 'Only the author or an admin can delete a comment.' }
    }

    // Capture reply ids BEFORE deleting the parent: on the D1/SQLite adapter,
    // deleting a doc cascades the relationship-table row backing other docs'
    // `parent` field, so a `parent: { equals: commentId }` lookup done after
    // the parent is gone finds nothing — replies would survive as orphaned
    // top-level comments instead of being cascaded.
    const { docs: replies } = await payload.find({
      collection: 'comments',
      where: { parent: { equals: commentId } },
      overrideAccess: true,
      depth: 0,
      limit: 0,
    })

    await payload.delete({
      collection: 'comments',
      id: commentId,
      user,
      overrideAccess: false,
    })

    // Cascade replies and inbox rows pointing at this comment. System-scoped:
    // replies belong to other authors, and the authorization gate was the
    // delete above. Best-effort — the comment itself is already gone.
    try {
      if (replies.length > 0) {
        await payload.delete({
          collection: 'comments',
          where: { id: { in: replies.map((reply) => reply.id) } },
          overrideAccess: true,
        })
      }
      await payload.delete({
        collection: 'notifications',
        where: { comment: { in: [commentId, ...replies.map((reply) => reply.id)] } },
        overrideAccess: true,
      })
    } catch (error) {
      payload.logger.error({ err: error, commentId }, 'deleteComment: cascade cleanup failed')
    }
  } catch (error) {
    payload.logger.error({ err: error, commentId }, 'deleteComment: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}
