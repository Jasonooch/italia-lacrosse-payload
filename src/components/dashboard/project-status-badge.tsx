import type { Project } from '@/payload-types'
import { Badge } from '@/components/dashboard/ui/badge'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES } from '@/lib/project-display'

export function StatusBadge({ status }: { status: Project['status'] }) {
  return <Badge className={PROJECT_STATUS_STYLES[status]}>{PROJECT_STATUS_LABELS[status]}</Badge>
}
