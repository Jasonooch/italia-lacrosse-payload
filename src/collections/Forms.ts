import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const Forms: CollectionConfig = {
  slug: 'forms',
  timestamps: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'isActive', 'isPublic', 'updatedAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone, // Public forms need to be accessible
    update: authenticated,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Form title displayed to users',
      },
    },
    ...slugField('title'),
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional description shown above the form',
      },
    },
    {
      name: 'fields',
      type: 'json',
      required: true,
      defaultValue: [],
      admin: {
        description: 'Form field definitions (managed via dashboard)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Whether this form accepts submissions',
      },
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Whether this form is publicly visible',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'User who created this form',
      },
      hooks: {
        beforeChange: [
          ({ req, operation, value }) => {
            if (operation === 'create' && req.user) {
              return req.user.id
            }
            return value
          },
        ],
      },
    },
  ],
}
