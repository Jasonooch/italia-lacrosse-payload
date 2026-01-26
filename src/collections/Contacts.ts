import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  timestamps: true,
  admin: {
    useAsTitle: 'lastName',
    defaultColumns: ['firstName', 'lastName', 'email', 'contactType', 'program', 'updatedAt'],
    group: 'Management',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  fields: [
    // Basic Information
    {
      name: 'firstName',
      type: 'text',
      required: true,
      admin: {
        description: 'Contact first name',
      },
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      admin: {
        description: 'Contact last name',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Contact email address',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Contact phone number',
      },
    },

    // Contact Classification
    {
      name: 'contactType',
      type: 'select',
      required: true,
      defaultValue: 'player',
      options: [
        { label: 'Player', value: 'player' },
        { label: 'Donor', value: 'donor' },
        { label: 'Coach', value: 'coach' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Type of contact',
      },
    },

    // Player-Specific Fields
    {
      name: 'program',
      type: 'select',
      options: [
        { label: "Men's", value: 'mens' },
        { label: "Women's", value: 'womens' },
        { label: 'Boys Youth', value: 'boys-youth' },
        { label: 'Girls Youth', value: 'girls-youth' },
        { label: 'Fundraising', value: 'fundraising' },
        { label: 'Donor', value: 'donor' },
        { label: 'Coaching', value: 'coaching' },
      ],
      admin: {
        description: 'Program or interest area',
      },
    },
    {
      name: 'position',
      type: 'select',
      options: [
        { label: 'Attack', value: 'attack' },
        { label: 'Midfield', value: 'midfield' },
        { label: 'LSM', value: 'lsm' },
        { label: 'Defense', value: 'defense' },
        { label: 'Goalie', value: 'goalie' },
        { label: 'Face Off', value: 'faceoff' },
      ],
      admin: {
        condition: (data) => data.contactType === 'player',
        description: 'Playing position',
      },
    },
    {
      name: 'dateOfBirth',
      type: 'date',
      admin: {
        condition: (data) => data.contactType === 'player',
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Date of birth',
      },
    },
    {
      name: 'highSchool',
      type: 'text',
      admin: {
        condition: (data) => data.contactType === 'player',
        description: 'High school attended',
      },
    },
    {
      name: 'professionalExperience',
      type: 'textarea',
      admin: {
        condition: (data) => data.contactType === 'player',
        description: 'Professional lacrosse experience',
      },
    },
    {
      name: 'highlightTape',
      type: 'text',
      admin: {
        condition: (data) => data.contactType === 'player',
        description: 'Link to highlight video',
      },
    },
    {
      name: 'playerStatus',
      type: 'select',
      options: [
        { label: 'Candidate', value: 'candidate' },
        { label: 'Pending', value: 'pending' },
        { label: 'Citizen', value: 'citizen' },
      ],
      admin: {
        condition: (data) => data.contactType === 'player',
        description: 'Recruitment pipeline stage',
      },
    },

    // Background Information
    {
      name: 'education',
      label: 'College',
      type: 'text',
      admin: {
        description: 'College attended',
      },
    },
    {
      name: 'graduationYear',
      type: 'number',
      admin: {
        description: 'Expected or actual graduation year',
      },
    },
    {
      name: 'currentLocation',
      type: 'text',
      admin: {
        description: 'Current city and state',
      },
    },
    {
      name: 'lineage',
      type: 'select',
      options: [
        { label: 'I am an Italian citizen', value: 'italian-citizen' },
        { label: 'Parent', value: 'parent' },
        { label: 'Grandfather', value: 'grandfather' },
        { label: 'Grandmother', value: 'grandmother' },
        { label: 'Great-Grandfather', value: 'great-grandfather' },
        { label: 'Great-Grandmother', value: 'great-grandmother' },
        { label: "I'm not sure", value: 'not-sure' },
      ],
      admin: {
        description: 'Closest Italian-born relative',
      },
    },
    {
      name: 'citizenship',
      type: 'select',
      options: [
        { label: 'Citizen', value: 'citizen' },
        { label: 'Pending', value: 'pending' },
        { label: 'DNQ', value: 'dnq' },
        { label: 'Not A Citizen', value: 'not-a-citizen' },
      ],
      admin: {
        description: 'Italian citizenship status',
      },
    },

    // Address
    {
      name: 'address',
      type: 'group',
      admin: {
        description: 'Mailing address',
      },
      fields: [
        {
          name: 'street',
          type: 'text',
          admin: {
            description: 'Street address',
          },
        },
        {
          name: 'city',
          type: 'text',
          admin: {
            description: 'City',
          },
        },
        {
          name: 'state',
          type: 'text',
          admin: {
            description: 'State or province',
          },
        },
        {
          name: 'zip',
          type: 'text',
          admin: {
            description: 'Zip or postal code',
          },
        },
        {
          name: 'country',
          type: 'text',
          defaultValue: 'USA',
          admin: {
            description: 'Country',
          },
        },
      ],
    },

    // Notes & History
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'General notes about this contact',
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      admin: {
        description: 'Staff-only internal notes',
      },
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Tags for filtering and organization',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },

    // Source Tracking
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'CSV Import', value: 'csv-import' },
        { label: 'Interest Form', value: 'interest-form' },
        { label: 'Manual Entry', value: 'manual' },
      ],
      admin: {
        position: 'sidebar',
        description: 'How this contact was created',
      },
    },
    {
      name: 'sourceFormSubmission',
      type: 'relationship',
      relationTo: 'form-submissions',
      admin: {
        condition: (data) => data.source === 'interest-form',
        description: 'Original form submission if created from interest form',
      },
    },
    {
      name: 'lastContactedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'MMM d, yyyy h:mm a',
        },
        description: 'Last time staff reached out to this contact',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'User who created this contact',
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
