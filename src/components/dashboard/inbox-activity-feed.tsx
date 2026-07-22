'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { loadMoreGlobalActivity } from '@/app/(dashboard)/dashboard/inbox/actions'
import type { InboxFeedItem, InboxFeedPage } from '@/lib/inbox-activity'
import { ActivityTypeIcon } from '@/components/dashboard/activity-icons'
import { RelativeTime } from '@/components/dashboard/relative-time'
import { Button } from '@/components/dashboard/ui/button'

function TimeLabel({ iso }: { iso: string }) {
  return <RelativeTime iso={iso} className="shrink-0 text-xs text-muted-foreground" />
}

function itemKey(item: InboxFeedItem): string {
  return `${item.kind}-${item.id}`
}

export function InboxActivityFeed({ initial }: { initial: InboxFeedPage }) {
  const [items, setItems] = useState(initial.items)
  const [cursor, setCursor] = useState(initial.nextCursor)
  const [isPending, startTransition] = useTransition()

  function loadMore() {
    if (!cursor) return
    startTransition(async () => {
      const next = await loadMoreGlobalActivity(cursor)
      // The cursor is inclusive, so the boundary item comes back again — drop
      // anything already shown before appending.
      const seen = new Set(items.map(itemKey))
      const newItems = next.items.filter((item) => !seen.has(itemKey(item)))
      setItems((prev) => [...prev, ...newItems])
      // If a page produced nothing new and the cursor didn't advance, we're at
      // the end — stop rather than looping on the same timestamp.
      setCursor(next.nextCursor === cursor && newItems.length === 0 ? null : next.nextCursor)
    })
  }

  // Legacy entries whose project was deleted before cascade-cleanup existed
  // have no project to link to — render them inert instead of a dead link.
  function FeedRow({
    projectId,
    className,
    children,
  }: {
    projectId: number
    className: string
    children: React.ReactNode
  }) {
    if (!projectId) return <div className={className}>{children}</div>
    return (
      <Link href={`/dashboard/projects/${projectId}?tab=activity`} className={className}>
        {children}
      </Link>
    )
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
            <FeedRow
              key={`comment-${item.id}`}
              projectId={item.projectId}
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
            </FeedRow>
          ) : (
            <FeedRow
              key={`activity-${item.id}`}
              projectId={item.projectId}
              className="flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-accent/50"
            >
              <ActivityTypeIcon type={item.type} />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{item.actorName}</span> {item.summary}{' '}
                <span className="text-muted-foreground">in {item.projectTitle}</span>
              </span>
              <TimeLabel iso={item.createdAt} />
            </FeedRow>
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
