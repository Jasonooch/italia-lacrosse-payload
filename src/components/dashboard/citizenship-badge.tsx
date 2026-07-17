import type { Contact } from '@/payload-types'
import { Badge } from '@/components/dashboard/ui/badge'
import { CITIZENSHIP_LABELS, CITIZENSHIP_STYLES } from '@/lib/contact-display'

export function CitizenshipBadge({ citizenship }: { citizenship: Contact['citizenship'] }) {
  if (!citizenship) {
    return <Badge className="bg-muted text-muted-foreground">—</Badge>
  }
  return (
    <Badge className={CITIZENSHIP_STYLES[citizenship]}>{CITIZENSHIP_LABELS[citizenship]}</Badge>
  )
}
