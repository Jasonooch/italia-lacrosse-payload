import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

// Staff comments on a project's Activity tab. Single-level threading: a comment
// with a `parent` is a reply; top-level comments have none. Written only by the
// dashboard `addComment` server action (author is passed explicitly), never
// system-generated — activity entries live in the separate `activity-log`
// collection and are merged with comments in the UI by `createdAt`.
export const Comments: CollectionConfig = {
  slug: 'comments',
  timestamps: true,
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['body', 'project', 'author', 'createdAt'],
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
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
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
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'comments',
      admin: {
        description: 'Set when this comment is a reply to another comment.',
      },
    },
  ],
}
