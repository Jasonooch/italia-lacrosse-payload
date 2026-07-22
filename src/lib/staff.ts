import type { User } from '@/payload-types'

/**
 * The subset of a user doc the dashboard UI actually needs. Server pages map
 * full `User` docs through `toStaffUser` before handing them to client
 * components, so the RSC payload doesn't ship roles, timestamps, or whatever
 * auth-adjacent fields future Payload versions expose.
 */
export interface StaffUser {
  id: number
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  email: string
}

export function toStaffUser(user: User): StaffUser {
  const { id, name, firstName, lastName, email } = user
  return { id, name, firstName, lastName, email }
}

export function toStaffUsers(users: User[]): StaffUser[] {
  return users.map(toStaffUser)
}

/** Display name for a staff member, falling back to email, then "Someone". */
export function staffName(user: StaffUser | null | undefined): string {
  if (!user) return 'Someone'
  return user.name?.trim() || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
}
