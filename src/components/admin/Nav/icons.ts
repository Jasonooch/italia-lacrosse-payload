import {
  Calendar,
  CalendarDays,
  ClipboardList,
  Contact,
  FilePen,
  FolderTree,
  GraduationCap,
  Image,
  Inbox,
  LayoutDashboard,
  Shield,
  User,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const collectionIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  posts: FilePen,
  categories: FolderTree,
  tournaments: Calendar,
  events: CalendarDays,
  teams: Shield,
  players: User,
  coaches: GraduationCap,
  contacts: Contact,
  users: Users,
  media: Image,
  forms: ClipboardList,
  'form-submissions': Inbox,
}
