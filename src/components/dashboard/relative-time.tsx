'use client'

import { useEffect, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'

/** Absolute date on first paint (matches SSR), then swaps to a relative label
 * after mount — avoids a hydration mismatch from server/client clock or TZ. */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const date = new Date(iso)
  const spanClassName = className ?? 'text-xs text-muted-foreground'
  if (!mounted) {
    return <span className={spanClassName}>{format(date, 'MMM d')}</span>
  }
  const seconds = (Date.now() - date.getTime()) / 1000
  const label = seconds < 60 ? 'just now' : formatDistanceToNow(date, { addSuffix: true })
  return (
    <span className={spanClassName} title={format(date, 'PPpp')}>
      {label}
    </span>
  )
}
