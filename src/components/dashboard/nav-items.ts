import { CalendarDays, FolderKanban, Inbox, LayoutDashboard, Users } from 'lucide-react'

export const navItems = [
  { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Projects', url: '/dashboard/projects', icon: FolderKanban },
  { title: 'Contacts', url: '/dashboard/contacts', icon: Users },
  { title: 'Form Submissions', url: '/dashboard/form-submissions', icon: Inbox },
  { title: 'Calendar', url: '/dashboard/calendar', icon: CalendarDays },
] as const
