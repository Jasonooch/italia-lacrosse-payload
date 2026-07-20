'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireDashboardUser } from '@/lib/auth'
import { notify } from '@/lib/notifications'
import type { Contact } from '@/payload-types'

export interface ContactFormInput {
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  contactType: Contact['contactType']
  program?: Contact['program']
  status?: Contact['status']
  parentEmail?: string | null
  parentPhone?: string | null
  dateOfBirth?: string | null
  lineage?: Contact['lineage']
  involvement?: string | null
  coachingExperience?: string | null
  position?: Contact['position']
  highSchool?: string | null
  college?: string | null
  graduationYear?: number | null
  professionalExperience?: string | null
  highlightTape?: string | null
  address?: {
    street?: string | null
    city?: string | null
    state?: string | null
    zip?: string | null
    country?: string | null
  }
}

function toContactData(input: ContactFormInput) {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    contactType: input.contactType,
    program: input.program || null,
    status: input.status || null,
    'parent-email': input.parentEmail?.trim() || null,
    'parent-phone': input.parentPhone?.trim() || null,
    dateOfBirth: input.dateOfBirth || null,
    lineage: input.lineage || null,
    involvement: input.involvement?.trim() || null,
    coachingExperience: input.coachingExperience?.trim() || null,
    position: input.position || null,
    highSchool: input.highSchool?.trim() || null,
    college: input.college?.trim() || null,
    graduationYear: input.graduationYear ?? null,
    professionalExperience: input.professionalExperience?.trim() || null,
    highlightTape: input.highlightTape?.trim() || null,
    address: {
      street: input.address?.street?.trim() || null,
      city: input.address?.city?.trim() || null,
      state: input.address?.state?.trim() || null,
      zip: input.address?.zip?.trim() || null,
      country: input.address?.country?.trim() || null,
    },
  }
}

export async function createContact(input: ContactFormInput) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const created = await payload.create({
    collection: 'contacts',
    data: toContactData(input),
    user,
    overrideAccess: false,
  })

  revalidatePath('/dashboard/contacts')
  redirect(`/dashboard/contacts/${created.id}`)
}

export async function updateContact(contactId: number, input: ContactFormInput) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  await payload.update({
    collection: 'contacts',
    id: contactId,
    data: toContactData(input),
    user,
    overrideAccess: false,
  })

  revalidatePath(`/dashboard/contacts/${contactId}`)
  revalidatePath('/dashboard/contacts')
}

/** Post a note on a contact's detail page. Flat log, no threading. Pass
 * `mentionIds` for staff @-mentioned in the body — each gets a 'mention'
 * inbox notification. */
export async function addContactNote(contactId: number, body: string, mentionIds: number[] = []) {
  const user = await requireDashboardUser()
  const trimmed = body.trim()
  if (!trimmed) return

  const payload = await getPayload({ config })
  const uniqueMentions = [...new Set(mentionIds)]

  const note = await payload.create({
    collection: 'contact-notes',
    data: {
      contact: contactId,
      author: user.id,
      body: trimmed,
      mentions: uniqueMentions,
    },
    user,
    overrideAccess: false,
  })

  const contact = await payload.findByID({
    collection: 'contacts',
    id: contactId,
    user,
    overrideAccess: false,
    depth: 0,
    disableErrors: true,
  })

  if (contact && uniqueMentions.length > 0) {
    await notify(payload, user, {
      recipientIds: uniqueMentions,
      type: 'mention',
      contactId,
      contactNoteId: note.id,
      summary: `mentioned you in a note on ${contact.fullName}`,
    })
  }

  revalidatePath(`/dashboard/contacts/${contactId}`)
}

/** Edit a note's body/mentions. Only the author may edit their own. */
export async function editContactNote(
  noteId: number,
  contactId: number,
  body: string,
  mentionIds: number[] = [],
) {
  const user = await requireDashboardUser()
  const trimmed = body.trim()
  if (!trimmed) return

  const payload = await getPayload({ config })

  const note = await payload.findByID({
    collection: 'contact-notes',
    id: noteId,
    user,
    overrideAccess: false,
    depth: 0,
    disableErrors: true,
  })

  if (!note) return
  const authorId = typeof note.author === 'object' ? note.author.id : note.author
  if (authorId !== user.id) return

  await payload.update({
    collection: 'contact-notes',
    id: noteId,
    data: { body: trimmed, mentions: [...new Set(mentionIds)] },
    user,
    overrideAccess: false,
  })

  revalidatePath(`/dashboard/contacts/${contactId}`)
}

/** Delete a note. Only the author or an admin may remove it. */
export async function deleteContactNote(noteId: number, contactId: number) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const note = await payload.findByID({
    collection: 'contact-notes',
    id: noteId,
    user,
    overrideAccess: false,
    depth: 0,
    disableErrors: true,
  })

  if (!note) return
  const authorId = typeof note.author === 'object' ? note.author.id : note.author
  const isAdmin = user.roles?.includes('admin')
  if (authorId !== user.id && !isAdmin) return

  await payload.delete({
    collection: 'contact-notes',
    id: noteId,
    user,
    overrideAccess: false,
  })

  revalidatePath(`/dashboard/contacts/${contactId}`)
}
