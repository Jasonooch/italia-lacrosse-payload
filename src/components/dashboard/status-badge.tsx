import type { Contact } from '@/payload-types'
import { Badge } from '@/components/dashboard/ui/badge'
import { STATUS_LABELS, STATUS_STYLES } from '@/lib/contact-display'

export function StatusBadge({ status }: { status: Contact['status'] }) {
  if (!status) {
    return <Badge className="bg-muted text-muted-foreground">—</Badge>
  }
  return <Badge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>
}
