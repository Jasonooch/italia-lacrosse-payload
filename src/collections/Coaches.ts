import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { adminOnly } from '@/access'

export const Coaches: CollectionConfig = {
  slug: 'coaches',
  timestamps: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    ...slugField('name'),
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Coach background and experience (optional)',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Coach headshot or profile photo',
      },
    },
  ],
}
