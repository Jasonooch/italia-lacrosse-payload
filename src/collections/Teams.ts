import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const Teams: CollectionConfig = {
  slug: 'teams',
  timestamps: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'shortName', 'updatedAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
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
      admin: {
        description: 'Abbreviated team name (e.g., "ITA M", "ITA W")',
      },
    },
    {
      name: 'displayName',
      type: 'text',
      admin: {
        description: 'Short display name used in event names (e.g., "Men\'s" for "2026 Men\'s World Championship")',
      },
    },
    {
      name: 'mediaGallery',
      type: 'array',
      maxRows: 5,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'donationImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Image used for donation campaigns',
      },
    },
    {
      name: 'coachingStaff',
      type: 'array',
      label: 'Coaching Staff',
      admin: {
        description: 'Coaches assigned to this team with their roles',
      },
      fields: [
        {
          name: 'coach',
          type: 'relationship',
          relationTo: 'coaches',
          required: true,
        },
        {
          name: 'role',
          type: 'select',
          required: true,
          options: [
            { label: 'Head Coach', value: 'head-coach' },
            { label: 'Assistant Coach', value: 'assistant-coach' },
            { label: 'Team Manager', value: 'team-manager' },
            { label: 'Team Trainer', value: 'team-trainer' },
          ],
        },
      ],
    },
  ],
}
