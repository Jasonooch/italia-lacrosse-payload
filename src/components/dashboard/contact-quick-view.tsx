'use client'

import Link from 'next/link'
import type { Contact } from '@/payload-types'
import { Button } from '@/components/dashboard/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/dashboard/ui/sheet'
import { CitizenshipBadge } from '@/components/dashboard/citizenship-badge'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { CopyEmailButton } from '@/components/dashboard/copy-email-button'
import {
  CONTACT_TYPE_LABELS,
  PROGRAM_LABELS,
  getContactSubtitle,
  getInitials,
} from '@/lib/contact-display'

function QuickField({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === '') return null
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-sm">{value}</p>
    </div>
  )
}

export function ContactQuickView({
  contact,
  open,
  onOpenChange,
}: {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        {contact && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                  {getInitials(contact.firstName, contact.lastName)}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{contact.fullName}</SheetTitle>
                  <SheetDescription className="truncate">
                    {getContactSubtitle(contact)}
                  </SheetDescription>
                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    <CitizenshipBadge citizenship={contact.citizenship} />
                    {contact.status && <StatusBadge status={contact.status} />}
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="grid gap-4 px-4">
              <QuickField
                label="Email"
                value={
                  <span className="inline-flex items-center gap-2">
                    <a href={`mailto:${contact.email}`} className="hover:underline">
                      {contact.email}
                    </a>
                    <CopyEmailButton email={contact.email} />
                  </span>
                }
              />
              <QuickField
                label="Phone"
                value={
                  contact.phone ? (
                    <a href={`tel:${contact.phone}`} className="hover:underline">
                      {contact.phone}
                    </a>
                  ) : undefined
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <QuickField label="Contact type" value={CONTACT_TYPE_LABELS[contact.contactType]} />
                <QuickField
                  label="Program"
                  value={contact.program ? PROGRAM_LABELS[contact.program] : undefined}
                />
              </div>
              <QuickField label="Notes" value={contact.notes} />
            </div>

            <SheetFooter>
              <Button asChild>
                <Link href={`/dashboard/contacts/${contact.id}`}>View Full Details</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
