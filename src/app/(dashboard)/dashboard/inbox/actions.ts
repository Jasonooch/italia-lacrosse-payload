'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { requireDashboardUser } from '@/lib/auth'

/** Marks every unread notification for the current user as read. */
export async function markAllNotificationsRead() {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  await payload.update({
    collection: 'notifications',
    where: {
      and: [{ recipient: { equals: user.id } }, { read: { equals: false } }],
    },
    data: { read: true },
    user,
    overrideAccess: false,
  })

  revalidatePath('/dashboard/inbox')
  revalidatePath('/dashboard', 'layout')
}

/** Marks a single notification read — used when the user clicks through to the
 * linked project. Scoped to the current user so one can't flip another's rows. */
export async function markNotificationRead(notificationId: number) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  await payload.update({
    collection: 'notifications',
    where: {
      and: [{ id: { equals: notificationId } }, { recipient: { equals: user.id } }],
    },
    data: { read: true },
    user,
    overrideAccess: false,
  })

  revalidatePath('/dashboard/inbox')
  revalidatePath('/dashboard', 'layout')
}
