'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireDashboardUser } from '@/lib/auth'
import type { Project } from '@/payload-types'
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

export async function deleteProject(projectId: number) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'projects',
    id: projectId,
    user,
    overrideAccess: false,
  })

  revalidatePath('/dashboard/projects')
  redirect('/dashboard/projects')
}

export async function updateMilestoneStatus(
  projectId: number,
  milestoneId: string,
  status: MilestoneStatus,
) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

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

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
}

/** Payload's `team` relationship is stored as ids or populated docs depending on
 * depth; normalize to plain ids before writing back. */
function toUserIds(team: Project['team']) {
  return (team ?? []).map((member) => (typeof member === 'object' ? member.id : member))
}

export async function addTeamMember(projectId: number, userId: number) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const project = await payload.findByID({
    collection: 'projects',
    id: projectId,
    user,
    overrideAccess: false,
    depth: 0,
  })

  const currentIds = toUserIds(project.team)
  if (currentIds.includes(userId)) return

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

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
}

export async function removeTeamMember(projectId: number, userId: number) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

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

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
}

export async function updateProjectStatus(projectId: number, status: ProjectStatus) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

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

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
}

export interface MilestoneInput {
  title: string
  dueDate?: string | null
  assignee?: number | null
}

export async function addMilestone(projectId: number, input: MilestoneInput) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

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
      title: input.title,
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

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
}

export async function updateMilestone(
  projectId: number,
  milestoneId: string,
  input: MilestoneInput,
) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

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
          title: input.title,
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

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
}

export async function deleteMilestone(projectId: number, milestoneId: string) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

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

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
}

/** Adds a resource from a FormData payload: `title` plus either a `url` string
 * or an uploaded `file`. Files land in the staff-only `project-files`
 * collection and are linked from the project's resources array. */
export async function addProjectResource(projectId: number, formData: FormData) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const title = String(formData.get('title') ?? '').trim()
  if (!title) return

  const url = String(formData.get('url') ?? '').trim()
  const file = formData.get('file')

  let fileId: number | null = null
  if (file instanceof File && file.size > 0) {
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
    fileId = uploaded.id
  }

  if (!url && fileId == null) return

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

  revalidatePath(`/dashboard/projects/${projectId}`)
}

/** Edits a resource in place: `title` always updates; a new `file` or a
 * non-empty `url` replaces the existing source (and orphans the old upload,
 * if any), while leaving both blank keeps the current source untouched. */
export async function editProjectResource(projectId: number, resourceId: string, formData: FormData) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const title = String(formData.get('title') ?? '').trim()
  if (!title) return

  const url = String(formData.get('url') ?? '').trim()
  const file = formData.get('file')

  const project = await payload.findByID({
    collection: 'projects',
    id: projectId,
    user,
    overrideAccess: false,
    depth: 0,
  })

  const existing = (project.resources ?? []).find((resource) => resource.id === resourceId)
  if (!existing) return

  const existingFileId =
    existing.file != null ? (typeof existing.file === 'object' ? existing.file.id : existing.file) : null

  let fileId = existingFileId
  let nextUrl = existing.url ?? null
  let staleFileId: number | null = null

  if (file instanceof File && file.size > 0) {
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
    fileId = uploaded.id
    nextUrl = null
    staleFileId = existingFileId
  } else if (url) {
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
    } catch {
      // The resource itself already updated; a failed cleanup shouldn't surface.
    }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
}

export async function deleteProjectResource(projectId: number, resourceId: string) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

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
  const removedFileId =
    removed?.file != null ? (typeof removed.file === 'object' ? removed.file.id : removed.file) : null
  if (removedFileId != null) {
    try {
      await payload.delete({
        collection: 'project-files',
        id: removedFileId,
        user,
        overrideAccess: false,
      })
    } catch {
      // The resource itself is gone; a failed file cleanup shouldn't surface.
    }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
}

/** Persist a new milestone order. `orderedIds` is the full set of milestone
 * ids in the desired order; any id not present is dropped, and unknown ids are
 * ignored, so a stale client can't corrupt the array. */
export async function reorderMilestones(projectId: number, orderedIds: string[]) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const project = await payload.findByID({
    collection: 'projects',
    id: projectId,
    user,
    overrideAccess: false,
    depth: 0,
  })

  const current = project.milestones ?? []
  const byId = new Map(current.map((milestone) => [milestone.id, milestone]))
  const reordered = orderedIds
    .map((id) => byId.get(id))
    .filter((milestone): milestone is (typeof current)[number] => Boolean(milestone))

  // Guard against a mismatched client payload: only write when the reordered
  // set is a pure permutation of what's stored.
  if (reordered.length !== current.length) return

  await payload.update({
    collection: 'projects',
    id: projectId,
    data: { milestones: reordered },
    user,
    overrideAccess: false,
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
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
) {
  const user = await requireDashboardUser()
  const trimmed = body.trim()
  if (!trimmed) return

  const payload = await getPayload({ config })

  const uniqueMentions = [...new Set(mentionIds)]

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

  revalidatePath(`/dashboard/projects/${projectId}`)
}

/** Edit a comment's body/mentions. Only the author may edit their own. */
export async function editComment(
  commentId: number,
  projectId: number,
  body: string,
  mentionIds: number[] = [],
) {
  const user = await requireDashboardUser()
  const trimmed = body.trim()
  if (!trimmed) return

  const payload = await getPayload({ config })

  const comment = await payload.findByID({
    collection: 'comments',
    id: commentId,
    user,
    overrideAccess: false,
    depth: 0,
    disableErrors: true,
  })

  if (!comment) return
  const authorId = typeof comment.author === 'object' ? comment.author.id : comment.author
  if (authorId !== user.id) return

  await payload.update({
    collection: 'comments',
    id: commentId,
    data: { body: trimmed, mentions: [...new Set(mentionIds)] },
    user,
    overrideAccess: false,
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
}

/** Loads the next page of a project's Activity tab, older than `before`. */
export async function loadMoreProjectActivity(projectId: number, before: string) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })
  return fetchProjectActivityPage(payload, user, projectId, before)
}

/** Delete a comment. Only the author may remove their own; any reply threads
 * left orphaned are dropped by the caller's re-fetch (their `parent` FK is set
 * null on delete). */
export async function deleteComment(commentId: number, projectId: number) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const comment = await payload.findByID({
    collection: 'comments',
    id: commentId,
    user,
    overrideAccess: false,
    depth: 0,
    disableErrors: true,
  })

  if (!comment) return
  const authorId = typeof comment.author === 'object' ? comment.author.id : comment.author
  const isAdmin = user.roles?.includes('admin')
  if (authorId !== user.id && !isAdmin) return

  await payload.delete({
    collection: 'comments',
    id: commentId,
    user,
    overrideAccess: false,
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
}
