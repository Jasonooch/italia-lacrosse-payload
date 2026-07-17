'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, MoreVertical } from 'lucide-react'
import type { Contact } from '@/payload-types'
import { Checkbox } from '@/components/dashboard/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import { CopyEmailButton } from '@/components/dashboard/copy-email-button'
import { CitizenshipBadge } from '@/components/dashboard/citizenship-badge'
import { ContactQuickView } from '@/components/dashboard/contact-quick-view'
import {
  CONTACT_TYPE_LABELS,
  POSITION_LABELS,
  PROGRAM_LABELS,
  getInitials,
} from '@/lib/contact-display'

export function ContactsTable({
  contacts,
  page,
  totalPages,
  totalDocs,
  pagingCounter,
  filterQueryString,
}: {
  contacts: Contact[]
  page: number
  totalPages: number
  totalDocs: number
  /** 1-indexed position of the first row on this page, as returned by Payload's find(). */
  pagingCounter: number
  /** Current type/program/position filters, already URL-encoded, so page links don't drop them. */
  filterQueryString: string
}) {
  const [quickViewContact, setQuickViewContact] = useState<Contact | null>(null)

  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox aria-label="Select all contacts on this page" />
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Citizenship</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No contacts found.
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  onClick={() => setQuickViewContact(contact)}
                  className="cursor-pointer"
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox aria-label={`Select ${contact.fullName}`} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {getInitials(contact.firstName, contact.lastName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{contact.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {CONTACT_TYPE_LABELS[contact.contactType]}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.program ? PROGRAM_LABELS[contact.program] : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.position ? POSITION_LABELS[contact.position] : '—'}
                  </TableCell>
                  <TableCell>
                    <CitizenshipBadge citizenship={contact.citizenship} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-3">
                      <CopyEmailButton email={contact.email} />
                      <button
                        type="button"
                        onClick={() => setQuickViewContact(contact)}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={`View ${contact.fullName}`}
                      >
                        <Eye className="size-4" />
                      </button>
                      {/* Overflow actions have no destination yet — shown inert rather
                          than wired to a menu that doesn't exist. */}
                      <MoreVertical
                        className="size-4 cursor-not-allowed text-muted-foreground/40"
                        aria-label="More actions (coming soon)"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ContactQuickView
        contact={quickViewContact}
        open={quickViewContact !== null}
        onOpenChange={(open) => {
          if (!open) setQuickViewContact(null)
        }}
      />

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {contacts.length === 0
            ? `Showing 0 of ${totalDocs} contacts`
            : `Showing ${pagingCounter} to ${pagingCounter + contacts.length - 1} of ${totalDocs} contacts`}
        </span>
        <div className="flex items-center gap-1">
          <PageLink page={page - 1} disabled={page <= 1} filterQueryString={filterQueryString}>
            Previous
          </PageLink>
          {getPageWindow(page, totalPages).map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground/60">
                …
              </span>
            ) : (
              <PageLink
                key={p}
                page={p}
                active={p === page}
                filterQueryString={filterQueryString}
              >
                {p}
              </PageLink>
            ),
          )}
          <PageLink
            page={page + 1}
            disabled={page >= totalPages}
            filterQueryString={filterQueryString}
          >
            Next
          </PageLink>
        </div>
      </div>
    </div>
  )
}

function PageLink({
  page,
  children,
  active,
  disabled,
  filterQueryString,
}: {
  page: number
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  filterQueryString: string
}) {
  const className = active
    ? 'rounded-md bg-primary px-3 py-1.5 text-primary-foreground'
    : 'rounded-md px-3 py-1.5 hover:bg-accent hover:text-accent-foreground'

  if (disabled) {
    return <span className="rounded-md px-3 py-1.5 text-muted-foreground/40">{children}</span>
  }

  const href = filterQueryString ? `?page=${page}&${filterQueryString}` : `?page=${page}`

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

/** First page, last page, and the current page's immediate neighbors — with
 * ellipsis gaps. Without this, 1,800 contacts at a small page size would
 * render 100+ page links. */
function getPageWindow(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const keep = new Set<number>(
    [1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages),
  )
  const sorted = Array.from(keep).sort((a, b) => a - b)

  const result: (number | 'ellipsis')[] = []
  let previous = 0
  for (const p of sorted) {
    if (previous && p - previous > 1) result.push('ellipsis')
    result.push(p)
    previous = p
  }
  return result
}
