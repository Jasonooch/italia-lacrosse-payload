'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
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
import { loadMoreGlobalActivity } from '@/app/(dashboard)/dashboard/inbox/actions'
import type { InboxFeedPage } from '@/lib/inbox-activity'
import { Button } from '@/components/dashboard/ui/button'

const ACTIVITY_ICONS: Record<ActivityLog['type'], { Icon: LucideIcon; className: string }> = {
  'project-created': { Icon: Package, className: 'text-orange-500' },
  'status-changed': { Icon: CircleDot, className: 'text-blue-500' },
  'team-changed': { Icon: Users, className: 'text-purple-500' },
  'milestone-added': { Icon: Flag, className: 'text-muted-foreground' },
  'milestone-completed': { Icon: CheckCircle2, className: 'text-green-500' },
  'milestone-updated': { Icon: Flag, className: 'text-muted-foreground' },
  'resource-added': { Icon: Paperclip, className: 'text-muted-foreground' },
}

function relativeTime(iso: string) {
  const date = new Date(iso)
  const seconds = (Date.now() - date.getTime()) / 1000
  return seconds < 60 ? 'just now' : formatDistanceToNow(date, { addSuffix: true })
}

function TimeLabel({ iso }: { iso: string }) {
  return (
    <span className="shrink-0 text-xs text-muted-foreground" title={format(new Date(iso), 'PPpp')}>
      {relativeTime(iso)}
    </span>
  )
}

function ActivityTypeIcon({ type }: { type: ActivityLog['type'] }) {
  const { Icon, className } = ACTIVITY_ICONS[type]
  return <Icon className={'size-4 shrink-0 ' + className} />
}

export function InboxActivityFeed({ initial }: { initial: InboxFeedPage }) {
  const [items, setItems] = useState(initial.items)
  const [cursor, setCursor] = useState(initial.nextCursor)
  const [isPending, startTransition] = useTransition()

  function loadMore() {
    if (!cursor) return
    startTransition(async () => {
      const next = await loadMoreGlobalActivity(cursor)
      setItems((prev) => [...prev, ...next.items])
      setCursor(next.nextCursor)
    })
  }

  if (items.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No activity yet across your projects.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="divide-y rounded-lg border">
        {items.map((item) =>
          item.kind === 'comment' ? (
            <Link
              key={`comment-${item.id}`}
              href={`/dashboard/projects/${item.projectId}?tab=activity`}
              className="block px-4 py-3 transition-colors hover:bg-accent/50"
            >
              <p className="text-sm">
                <span className="font-medium">{item.authorName}</span> commented in{' '}
                <span className="font-medium">{item.projectTitle}</span>
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
              <div className="mt-1 flex items-center justify-between">
                <TimeLabel iso={item.createdAt} />
                {item.replies.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {item.replies.length} {item.replies.length === 1 ? 'reply' : 'replies'}
                  </span>
                )}
              </div>
            </Link>
          ) : (
            <Link
              key={`activity-${item.id}`}
              href={`/dashboard/projects/${item.projectId}?tab=activity`}
              className="flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-accent/50"
            >
              <ActivityTypeIcon type={item.type} />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{item.actorName}</span> {item.summary}{' '}
                <span className="text-muted-foreground">in {item.projectTitle}</span>
              </span>
              <TimeLabel iso={item.createdAt} />
            </Link>
          ),
        )}
      </div>
      {cursor && (
        <div className="flex justify-center pt-1">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={isPending}>
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
