import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  timestamps: true,
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'contactType', 'program', 'updatedAt'],
    group: 'Admin',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  fields: [
    // Virtual field for display
    {
      name: 'fullName',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return `${siblingData?.firstName || ''} ${siblingData?.lastName || ''}`.trim()
          },
        ],
      },
    },

    // Sidebar fields
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
      },
    },
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
        position: 'sidebar',
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
        position: 'sidebar',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
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
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'General notes about this contact',
      },
    },

    // Main content tabs
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basic Info',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'firstName',
                  type: 'text',
                  required: true,
                  admin: {},
                },
                {
                  name: 'lastName',
                  type: 'text',
                  required: true,
                  admin: {},
                },
              ],
            },
            {
              name: 'email',
              type: 'email',
              required: true,
              unique: true,
              index: true,
            },
            {
              name: 'phone',
              type: 'text',
            },
            {
              name: 'parent-email',
              type: 'email',
              unique: true,
              index: true,
              admin: {
                condition: (data) =>
                  data.program === 'boys-youth' || data.program === 'girls-youth',
              },
            },
            {
              name: 'parent-phone',
              type: 'text',
              admin: {
                condition: (data) =>
                  data.program === 'boys-youth' || data.program === 'girls-youth',
              },
            },
            {
              name: 'dateOfBirth',
              type: 'date',
              admin: {
                condition: (data) => data.contactType === 'player',
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
          ],
        },
        {
          label: 'Player Details',
          fields: [
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
              },
            },
            {
              name: 'highSchool',
              type: 'text',
              admin: {
                condition: (data) => data.contactType === 'player',
              },
            },
            {
              name: 'college',
              label: 'College',
              type: 'text',
              admin: {},
            },
            {
              name: 'graduationYear',
              type: 'number',
              admin: {
                description: 'Expected or actual graduation year',
              },
            },
            {
              name: 'professionalExperience',
              type: 'textarea',
              admin: {
                condition: (data) => data.contactType === 'player',
              },
            },
            {
              name: 'highlightTape',
              type: 'text',
              admin: {
                condition: (data) => data.contactType === 'player',
              },
            },
          ],
        },
        {
          label: 'Contact Info',
          fields: [
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
                  type: 'row',
                  fields: [
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
                  ],
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
            {
              name: 'sourceFormSubmission',
              type: 'relationship',
              relationTo: 'form-submissions',
              admin: {
                condition: (data) => data.source === 'interest-form',
                description: 'Original form submission if created from interest form',
              },
            },
          ],
        },
      ],
    },
  ],
}
