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
  event?: number | null
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
    event: input.event || null,
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

export async function addMilestone(
  projectId: number,
  input: { title: string; dueDate?: string | null; assignee?: number | null },
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
