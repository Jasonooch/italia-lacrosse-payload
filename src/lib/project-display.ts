import type { Project } from '@/payload-types'

export type ProjectStatus = Project['status']
export type MilestoneStatus = NonNullable<Project['milestones']>[number]['status']

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  completed: 'Completed',
  'on-hold': 'On Hold',
}

export const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  'not-started': 'bg-muted text-muted-foreground',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  'on-hold': 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
}

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  completed: 'Completed',
}

/** Solid dot color shown next to a milestone — mirrors the project status
 * badge palette so "in progress" and "completed" read consistently. */
export const MILESTONE_STATUS_DOT_STYLES: Record<MilestoneStatus, string> = {
  'not-started': 'bg-muted-foreground/30',
  'in-progress': 'bg-blue-500',
  completed: 'bg-green-500',
}

export const MILESTONE_STATUS_PILL_STYLES: Record<MilestoneStatus, string> = {
  'not-started': 'bg-muted text-muted-foreground',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
}

export function formatProjectDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
