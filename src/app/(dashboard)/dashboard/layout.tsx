import React from 'react'
import config from '@payload-config'
import { getPayload } from 'payload'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { NavUser } from '@/components/dashboard/nav-user'
import { ThemeToggle } from '@/components/dashboard/theme-toggle'
import { Separator } from '@/components/dashboard/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/dashboard/ui/sidebar'
import { requireDashboardUser } from '@/lib/auth'

/**
 * This gate covers the chrome and the initial request. It is not the last line
 * of defence: shared layouts are not guaranteed to re-run on every client-side
 * navigation, so any page that reads data must still go through the Payload
 * Local API with `user` + `overrideAccess: false` (see CLAUDE.md).
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const { totalDocs: unreadCount } = await payload.count({
    collection: 'notifications',
    where: {
      and: [{ recipient: { equals: user.id } }, { read: { equals: false } }],
    },
    user,
    overrideAccess: false,
  })

  return (
    <SidebarProvider>
      <AppSidebar unreadCount={unreadCount}>
        <NavUser name={user.name || `${user.firstName} ${user.lastName}`.trim()} email={user.email} />
      </AppSidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 !h-4" />
          <span className="text-sm text-muted-foreground">Staff Dashboard</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="min-w-0 flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
