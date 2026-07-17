'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronsUpDown } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/dashboard/ui/sidebar'
import { navItems } from '@/components/dashboard/nav-items'

export function AppSidebar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          {/* Decorative: the adjacent text already names the org. Plain <img>
              matches the Payload admin graphics and avoids next/image's loader
              on Workers. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-lt.png" alt="" className="size-8 shrink-0 object-contain" />
          <span className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">Italia Lacrosse</span>
            <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
          </span>
          {/* Decorative for now — no org switcher exists yet, so it isn't a button. */}
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                // Every route starts with /dashboard, so the Overview item would
                // match everything under prefix matching — it needs an exact match.
                const isActive =
                  item.url === '/dashboard'
                    ? pathname === item.url
                    : pathname === item.url || pathname.startsWith(`${item.url}/`)

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {children}
      <SidebarRail />
    </Sidebar>
  )
}
