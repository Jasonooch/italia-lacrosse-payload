import type { CollectionAfterChangeHook } from 'payload'

/**
 * Hook to automatically create a contact from a form submission
 * when the form has contact creation enabled
 */
export const createContactFromSubmission: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  // Only run on create operations
  if (operation !== 'create') {
    return doc
  }

  try {
    // Get the form details
    const form =
      typeof doc.form === 'object'
        ? doc.form
        : await req.payload.findByID({
            collection: 'forms',
            id: doc.form,
          })

    // Check if this form should create contacts
    if (!form?.createContact || !form?.contactFieldMapping) {
      return doc
    }

    const mapping = form.contactFieldMapping as Record<string, string>
    const submissionData = doc.submissionData as Record<string, unknown>

    // Build contact data from mapping
    const contactData: Record<string, unknown> = {
      contactType: form.contactType || 'player',
      source: 'interest-form',
      sourceFormSubmission: doc.id,
    }

    // Apply field mappings
    for (const [formField, contactField] of Object.entries(mapping)) {
      const value = submissionData[formField]

      if (value !== undefined && value !== null && value !== '') {
        // Handle special cases
        if (contactField === 'tags' && typeof value === 'string') {
          // Convert comma-separated string to array
          contactData[contactField] = value.split(',').map((t) => ({ tag: t.trim() }))
        } else if (contactField.startsWith('address.')) {
          // Handle nested address fields
          const addressField = contactField.split('.')[1]
          if (!contactData.address) {
            contactData.address = {}
          }
          ;(contactData.address as Record<string, unknown>)[addressField] = value
        } else {
          contactData[contactField] = value
        }
      }
    }

    // Validate required fields
    if (!contactData.firstName || !contactData.lastName || !contactData.email) {
      req.payload.logger.warn(
        `Cannot create contact from submission ${doc.id}: missing required fields (firstName, lastName, or email)`
      )
      return doc
    }

    // Create the contact
    const contact = await req.payload.create({
      collection: 'contacts',
      data: contactData as any,
      draft: false,
    })

    req.payload.logger.info(
      `Created contact ${contact.id} from form submission ${doc.id}`
    )

    // Update the submission to reference the created contact
    await req.payload.update({
      collection: 'form-submissions',
      id: doc.id,
      data: {
        contact: contact.id,
      },
      draft: false,
    })
  } catch (error) {
    req.payload.logger.error(
      `Error creating contact from submission ${doc.id}: ${error.message}`
    )
    // Don't fail the submission if contact creation fails
  }

  return doc
}
