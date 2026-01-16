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
    // Page Builder Sections
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero Section',
          fields: [
            {
              name: 'heroHeading',
              type: 'text',
              label: 'Heading',
              admin: {
                description: 'Main heading for the hero section',
              },
            },
            {
              name: 'heroStatLine',
              type: 'text',
              label: 'Stat Line',
              admin: {
                description: 'Statistics or tagline displayed in the hero section',
              },
            },
          ],
        },
        {
          label: 'About Section',
          fields: [
            {
              name: 'aboutHeading',
              type: 'text',
              label: 'Heading',
              admin: {
                description: 'Heading for the about section',
              },
            },
            {
              name: 'aboutContent',
              type: 'textarea',
              label: 'Content',
              admin: {
                description: 'Main content for the about section',
              },
            },
          ],
        },
        {
          label: 'Images',
          fields: [
            {
              name: 'aboutImage1',
              type: 'upload',
              relationTo: 'media',
              label: 'About Section Image 1',
              admin: {
                description: 'First image for the about section',
              },
            },
            {
              name: 'aboutImage2',
              type: 'upload',
              relationTo: 'media',
              label: 'About Section Image 2',
              admin: {
                description: 'Second image for the about section',
              },
            },
            {
              name: 'joinUsCTAImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Join Us CTA Image',
              admin: {
                description: 'Image for the Join Us call-to-action section',
              },
            },
          ],
        },
        {
          label: 'Team Data',
          fields: [
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
        },
      ],
    },
  ],
}
