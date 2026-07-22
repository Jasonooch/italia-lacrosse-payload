import type { Access } from 'payload'

/**
 * Row-level access: admins see/touch everything; everyone else is constrained
 * to rows where `field` (a user relationship, e.g. `author` or `recipient`)
 * points at themselves. Returned as a query constraint so it applies to both
 * single-doc and bulk operations, including the auto-generated REST/GraphQL
 * API — the dashboard server actions are not the only door into these
 * collections.
 */
export const ownRowOrAdmin =
  (field: string): Access =>
  ({ req: { user } }) => {
    if (!user) return false
    if (user.roles?.includes('admin')) return true
    return { [field]: { equals: user.id } }
  }
