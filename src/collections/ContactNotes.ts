import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { ownRowOrAdmin } from '../access/ownRowOrAdmin'

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
    // Row-level: only the author (or an admin) may change or remove a note —
    // enforced here so the REST/GraphQL API can't bypass the server actions.
    delete: ownRowOrAdmin('author'),
    read: authenticated,
    update: ownRowOrAdmin('author'),
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        // Non-admins always write as themselves — prevents forging `author`.
        if (req.user && !req.user.roles?.includes('admin')) {
          if (operation === 'create') data.author = req.user.id
          else delete data.author
        }
        return data
      },
    ],
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
