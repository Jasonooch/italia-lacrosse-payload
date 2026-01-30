import { CollectionConfig } from 'payload'

export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: {
    useAsTitle: 'title',
    group: 'Admin',
  },
  access: {
    read: () => true, // Public forms
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'formJSON',
      type: 'json',
      required: true,
      admin: {
        description: 'Paste your JSON data here',
      },
    },
  ],
}
