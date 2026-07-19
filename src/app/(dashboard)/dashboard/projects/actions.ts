'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireDashboardUser } from '@/lib/auth'
import type { Project } from '@/payload-types'
import type { MilestoneStatus, ProjectStatus } from '@/lib/project-display'

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
