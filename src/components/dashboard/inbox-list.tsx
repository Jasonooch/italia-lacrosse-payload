'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { AtSign, Bell, MessageSquare, type LucideIcon } from 'lucide-react'
import type { Notification } from '@/payload-types'
import { markAllNotificationsRead, markNotificationRead } from '@/app/(dashboard)/dashboard/inbox/actions'
import { Button } from '@/components/dashboard/ui/button'

export interface InboxItem {
  id: number
  type: Notification['type']
  summary: string
  actorName: string
  projectId: number | null
  projectTitle: string | null
  contactId: number | null
  contactTitle: string | null
  createdAt: string
  read: boolean
}

const TYPE_ICONS: Record<Notification['type'], { Icon: LucideIcon; className: string }> = {
  mention: { Icon: AtSign, className: 'text-blue-500' },
  comment: { Icon: MessageSquare, className: 'text-purple-500' },
  'project-activity': { Icon: Bell, className: 'text-muted-foreground' },
}

function relativeTime(iso: string) {
  const date = new Date(iso)
  const seconds = (Date.now() - date.getTime()) / 1000
  return seconds < 60 ? 'just now' : formatDistanceToNow(date, { addSuffix: true })
}

export function InboxList({ items }: { items: InboxItem[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const hasUnread = items.some((item) => !item.read)

  function openItem(item: InboxItem) {
    startTransition(async () => {
      if (!item.read) await markNotificationRead(item.id)
      if (item.projectId) {
        router.push(`/dashboard/projects/${item.projectId}?tab=activity`)
      } else if (item.contactId) {
        router.push(`/dashboard/contacts/${item.contactId}`)
      }
    })
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead()
    })
  }

  return (
    <div>
      {hasUnread && (
        <div className="mb-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={markAll} disabled={isPending}>
            Mark all as read
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          You&rsquo;re all caught up. Nothing in your inbox.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {items.map((item) => {
            const { Icon, className } = TYPE_ICONS[item.type]
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openItem(item)}
                disabled={isPending}
                className={
                  'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 disabled:opacity-60 ' +
                  (item.read ? '' : 'bg-accent/30')
                }
              >
                <Icon className={'mt-0.5 size-4 shrink-0 ' + className} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{item.actorName}</span> {item.summary}
                  </p>
                  {(item.projectTitle || item.contactTitle) && (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.projectTitle || item.contactTitle}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className="text-xs text-muted-foreground"
                    title={format(new Date(item.createdAt), 'PPpp')}
                  >
                    {relativeTime(item.createdAt)}
                  </span>
                  {!item.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
