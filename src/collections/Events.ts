import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const Events: CollectionConfig = {
  slug: 'events',
  timestamps: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'year', 'location', 'startDate', 'updatedAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    // Auto-Generated Name Fields (outside tabs)
    {
      name: 'year',
      type: 'number',
      required: true,
      min: 2024,
      max: 2050,
      defaultValue: new Date().getFullYear(),
      admin: {
        description: 'Event year',
      },
    },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      required: true,
      label: 'Team',
      admin: {
        description: 'Which Italian team is this event for?',
      },
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      options: [
        { label: 'World Championship', value: 'world-championship' },
        { label: 'European Championship', value: 'european-championship' },
        { label: 'Sixes World Championship', value: 'sixes-world-championship' },
        { label: 'Sixes European Championship', value: 'sixes-european-championship' },
      ],
      admin: {
        description: 'Type of event',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Auto-generated from year, team, and event type',
      },
      hooks: {
        beforeValidate: [
          async ({ data, req }) => {
            if (data && data.team && data.eventType && data.year) {
              // Safely extract team ID
              const teamId =
                typeof data.team === 'string'
                  ? data.team
                  : typeof data.team === 'number'
                    ? data.team
                    : data.team?.id

              // Only fetch if we have a valid team ID
              if (teamId) {
                try {
                  const team = await req.payload.findByID({
                    collection: 'teams',
                    id: teamId,
                  })

                  // Use displayName if available, otherwise fall back to name
                  const teamDisplay = (team as any)?.displayName || team?.name || ''

                  // Convert eventType to display format
                  const eventTypeDisplay = data.eventType
                    ?.split('-')
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')

                  // Generate name: "2026 Men's World Championship"
                  return `${data.year} ${teamDisplay} ${eventTypeDisplay}`
                } catch {
                  // If team fetch fails, return existing name or empty
                  return data?.name || ''
                }
              }
            }
            return data?.name || ''
          },
        ],
      },
    },
    ...slugField('name'),
    // Tabs
    {
      type: 'tabs',
      tabs: [
        // TAB 1 - Event Info
        {
          label: 'Event Info',
          fields: [
            // Basic Event Information
            {
              name: 'location',
              type: 'text',
              required: true,
              admin: {
                description: 'City and country (e.g., "Los Angeles, USA")',
              },
            },
            {
              name: 'venue',
              type: 'text',
              admin: {
                description: 'Venue name (e.g., "Dignity Health Sports Park") - optional',
              },
            },
            {
              name: 'startDate',
              type: 'date',
              required: true,
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'MMM d, yyyy',
                },
              },
            },
            {
              name: 'endDate',
              type: 'date',
              required: true,
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'MMM d, yyyy',
                },
              },
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Event/tournament logo',
              },
            },
            {
              name: 'eventWebsite',
              type: 'text',
              admin: {
                description: 'Official event website URL',
              },
              validate: (val: string | null | undefined) => {
                if (!val) return true
                return /^https?:\/\/.+/.test(val) || 'Must be a valid URL'
              },
            },
            {
              name: 'description',
              type: 'textarea',
              admin: {
                description: 'Event details and information (optional)',
              },
            },
          ],
        },
        // TAB 2 - Coaching Staff
        {
          label: 'Coaching Staff',
          fields: [
            {
              name: 'coachingStaff',
              type: 'array',
              label: 'Coaching Staff',
              admin: {
                description: 'Coaches and staff assigned to this event',
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
