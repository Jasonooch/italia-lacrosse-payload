import 'server-only'

import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import type { User } from '@/payload-types'

/**
 * Resolves the Payload session from the request cookies. Returns null when
 * signed out. The dashboard shares the Payload admin session, so there is no
 * separate login flow to maintain.
 */
export async function getDashboardUser(): Promise<User | null> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })
  return user
}

/**
 * Gate for dashboard routes. Mirrors the Payload admin's own access rule
 * (`Boolean(user)`) rather than checking `roles` — the `roles` field is
 * admin-only on read, so it is stripped for editors and can't be gated on.
 */
export async function requireDashboardUser(redirectTo = '/dashboard'): Promise<User> {
  const user = await getDashboardUser()

  if (!user) {
    redirect(`/admin/login?redirect=${encodeURIComponent(redirectTo)}`)
  }

  return user
}
