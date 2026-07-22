import {
  CheckCircle2,
  CircleDot,
  Flag,
  Package,
  Paperclip,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ActivityLog } from '@/payload-types'

export const ACTIVITY_ICONS: Record<ActivityLog['type'], { Icon: LucideIcon; className: string }> = {
  'project-created': { Icon: Package, className: 'text-orange-500' },
  'status-changed': { Icon: CircleDot, className: 'text-blue-500' },
  'team-changed': { Icon: Users, className: 'text-purple-500' },
  'milestone-added': { Icon: Flag, className: 'text-muted-foreground' },
  'milestone-completed': { Icon: CheckCircle2, className: 'text-green-500' },
  'milestone-updated': { Icon: Flag, className: 'text-muted-foreground' },
  'resource-added': { Icon: Paperclip, className: 'text-muted-foreground' },
}

export function ActivityTypeIcon({ type }: { type: ActivityLog['type'] }) {
  const { Icon, className } = ACTIVITY_ICONS[type]
  return <Icon className={'size-4 shrink-0 ' + className} />
}
