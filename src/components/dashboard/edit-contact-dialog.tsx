'use client'

import { useState, useTransition } from 'react'
import { Pencil } from 'lucide-react'
import type { Contact } from '@/payload-types'
import { updateContact } from '@/app/(dashboard)/dashboard/contacts/actions'
import {
  ContactFormFields,
  contactFormInputFrom,
  contactFormStateFrom,
  useContactFormState,
} from '@/components/dashboard/contact-form'
import { Button } from '@/components/dashboard/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'

export function EditContactDialog({ contact }: { contact: Contact }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useContactFormState(contact)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setState(contactFormStateFrom(contact))
    }
    setError(null)
  }

  function handleSubmit() {
    if (!state.firstName.trim() || !state.lastName.trim() || !state.email.trim()) {
      setError('First name, last name, and email are required.')
      return
    }
    setError(null)

    startTransition(async () => {
      await updateContact(contact.id, contactFormInputFrom(state))
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="size-4" />
        Edit Contact
      </Button>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit contact</DialogTitle>
          <DialogDescription>Update {contact.fullName}&apos;s info.</DialogDescription>
        </DialogHeader>

        <ContactFormFields state={state} setState={setState} />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
