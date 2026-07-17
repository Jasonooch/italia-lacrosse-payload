import { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: {
    useAsTitle: 'title',
    group: 'Admin',
  },
  access: {
    read: () => true, // Public forms
    create: authenticated,
    update: authenticated,
    delete: authenticated,
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
