'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireDashboardUser } from '@/lib/auth'
import { ACTION_FAILED, type ActionResult } from '@/lib/action-result'
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
export async function addContactNote(
  contactId: number,
  body: string,
  mentionIds: number[] = [],
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const trimmed = body.trim()
  if (!trimmed) return { ok: false, error: 'A note needs some text.' }

  const payload = await getPayload({ config })
  const uniqueMentions = [...new Set(mentionIds)]

  try {
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
  } catch (error) {
    payload.logger.error({ err: error, contactId }, 'addContactNote: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/contacts/${contactId}`)
  return { ok: true }
}

/** Edit a note's body/mentions. Only the author may edit their own. Staff
 * newly @-mentioned by the edit are notified. */
export async function editContactNote(
  noteId: number,
  contactId: number,
  body: string,
  mentionIds: number[] = [],
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const trimmed = body.trim()
  if (!trimmed) return { ok: false, error: 'A note needs some text.' }

  const payload = await getPayload({ config })

  try {
    const note = await payload.findByID({
      collection: 'contact-notes',
      id: noteId,
      user,
      overrideAccess: false,
      depth: 0,
      disableErrors: true,
    })

    if (!note) return { ok: false, error: 'That note no longer exists.' }
    const authorId = typeof note.author === 'object' ? note.author.id : note.author
    if (authorId !== user.id) return { ok: false, error: 'Only the author can edit a note.' }

    const uniqueMentions = [...new Set(mentionIds)]

    await payload.update({
      collection: 'contact-notes',
      id: noteId,
      data: { body: trimmed, mentions: uniqueMentions },
      user,
      overrideAccess: false,
    })

    // Anyone @-mentioned for the first time by this edit still deserves a ping.
    const previousMentions = new Set(
      (note.mentions ?? []).map((mention) => (typeof mention === 'object' ? mention.id : mention)),
    )
    const addedMentions = uniqueMentions.filter((id) => !previousMentions.has(id))
    if (addedMentions.length > 0) {
      const contact = await payload.findByID({
        collection: 'contacts',
        id: contactId,
        user,
        overrideAccess: false,
        depth: 0,
        disableErrors: true,
      })
      if (contact) {
        await notify(payload, user, {
          recipientIds: addedMentions,
          type: 'mention',
          contactId,
          contactNoteId: noteId,
          summary: `mentioned you in a note on ${contact.fullName}`,
        })
      }
    }
  } catch (error) {
    payload.logger.error({ err: error, noteId }, 'editContactNote: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/contacts/${contactId}`)
  return { ok: true }
}

/** Delete a note. Only the author or an admin may remove it. Notifications
 * pointing at the note are cascaded so the inbox doesn't keep dead links. */
export async function deleteContactNote(noteId: number, contactId: number): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  try {
    const note = await payload.findByID({
      collection: 'contact-notes',
      id: noteId,
      user,
      overrideAccess: false,
      depth: 0,
      disableErrors: true,
    })

    if (!note) return { ok: false, error: 'That note no longer exists.' }
    const authorId = typeof note.author === 'object' ? note.author.id : note.author
    const isAdmin = user.roles?.includes('admin')
    if (authorId !== user.id && !isAdmin) {
      return { ok: false, error: 'Only the author or an admin can delete a note.' }
    }

    await payload.delete({
      collection: 'contact-notes',
      id: noteId,
      user,
      overrideAccess: false,
    })

    try {
      await payload.delete({
        collection: 'notifications',
        where: { contactNote: { equals: noteId } },
        overrideAccess: true,
      })
    } catch (error) {
      payload.logger.error({ err: error, noteId }, 'deleteContactNote: cascade cleanup failed')
    }
  } catch (error) {
    payload.logger.error({ err: error, noteId }, 'deleteContactNote: failed')
    return ACTION_FAILED
  }

  revalidatePath(`/dashboard/contacts/${contactId}`)
  return { ok: true }
}
