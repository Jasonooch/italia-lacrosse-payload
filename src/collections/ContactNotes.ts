import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

// Staff notes on a contact's detail page. Flat, timestamped log — no
// threading. Written only by the dashboard note actions (author passed
// explicitly), same pattern as `comments` on projects.
export const ContactNotes: CollectionConfig = {
  slug: 'contact-notes',
  timestamps: true,
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['body', 'contact', 'author', 'createdAt'],
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
      name: 'contact',
      type: 'relationship',
      relationTo: 'contacts',
      required: true,
      index: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'mentions',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        description: 'Staff @-mentioned in the body; each gets an inbox notification.',
      },
    },
  ],
}
