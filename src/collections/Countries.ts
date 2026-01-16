import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { autoOrganizeMedia } from '../hooks/autoOrganizeMedia'

export const Countries: CollectionConfig = {
  slug: 'countries',
  timestamps: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'shortName', 'updatedAt'],
    group: 'Reference Data',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterChange: [autoOrganizeMedia('Country Flags', 'flag')],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    ...slugField('name'),
    {
      name: 'shortName',
      type: 'text',
      required: true,
      maxLength: 3,
      admin: {
        description: 'Country abbreviation (e.g., "USA", "GER", "CAN")',
      },
    },
    {
      name: 'flag',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Country flag image',
      },
    },
  ],
}
