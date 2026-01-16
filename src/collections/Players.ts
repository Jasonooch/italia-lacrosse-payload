import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const Players: CollectionConfig = {
  slug: 'players',
  timestamps: true,
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'position', 'updatedAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.firstName || data?.lastName) {
          data.fullName = [data.firstName, data.lastName].filter(Boolean).join(' ')
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'fullName',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'position',
      type: 'select',
      required: true,
      options: [
        { label: 'Attack', value: 'attack' },
        { label: 'Midfield', value: 'midfield' },
        { label: 'Defense', value: 'defense' },
        { label: 'Goalie', value: 'goalie' },
        { label: 'Face Off', value: 'face-off' },
      ],
      admin: {
        description: 'Primary playing position',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Player headshot or action photo (optional)',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Player background, hometown, achievements (optional)',
      },
    },
  ],
}
