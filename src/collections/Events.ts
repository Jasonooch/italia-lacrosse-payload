import type { CollectionConfig, DateFieldValidation } from 'payload'

import { authenticated } from '../access/authenticated'

export const Events: CollectionConfig = {
  slug: 'events',
  timestamps: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'eventType', 'startDate', 'team', 'updatedAt'],
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      defaultValue: 'meeting',
      options: [
        { label: 'Meeting', value: 'meeting' },
        { label: 'Tryout', value: 'tryout' },
        { label: 'Training Camp', value: 'training-camp' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayAndTime' },
          },
          validate: ((value, { siblingData }) => {
            const startDate = (siblingData as { startDate?: string })?.startDate
            if (!value || !startDate) return true
            return new Date(value) >= new Date(startDate) || 'End date must be after start date'
          }) as DateFieldValidation,
        },
      ],
    },
    {
      name: 'allDay',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Hide the time of day and show this as spanning the full day(s).',
      },
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      admin: {
        description: 'Which team this is for, if any.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
}
