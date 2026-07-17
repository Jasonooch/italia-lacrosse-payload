import { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    useAsTitle: 'form',
    group: 'Admin',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      admin: {
        description: 'The form that was submitted',
      },
    },
    {
      name: 'data',
      type: 'json',
      required: true,
      admin: {
        description: 'Raw submission data',
      },
    },
  ],
}
