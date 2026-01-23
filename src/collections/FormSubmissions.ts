import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  timestamps: true,
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['form', 'status', 'submittedAt', 'createdAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated, // Staff only
    update: authenticated,
  },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      admin: {
        description: 'The form this submission belongs to',
      },
    },
    {
      name: 'contact',
      type: 'relationship',
      relationTo: 'contacts',
      admin: {
        description: 'Associated contact record',
      },
    },
    {
      name: 'submissionData',
      type: 'json',
      required: true,
      admin: {
        description: 'Form response data',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Reviewed', value: 'reviewed' },
        { label: 'Processed', value: 'processed' },
        { label: 'Spam', value: 'spam' },
        { label: 'Test', value: 'test' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Submission processing status',
      },
    },
    {
      name: 'submittedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'MMM d, yyyy h:mm a',
        },
        description: 'When the form was submitted',
      },
      hooks: {
        beforeChange: [
          ({ operation, value }) => {
            if (operation === 'create' && !value) {
              return new Date().toISOString()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'IP address of submitter',
      },
    },
  ],
}
