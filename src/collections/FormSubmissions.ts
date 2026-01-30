import { CollectionConfig } from 'payload'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    useAsTitle: 'form',
    group: 'Admin',
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
