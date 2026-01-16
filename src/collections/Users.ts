import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'System',
  },
  auth: true,
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Make the first user an admin automatically
        if (operation === 'create') {
          const existingUsers = await req.payload.count({ collection: 'users' })
          if (existingUsers.totalDocs === 0) {
            data.roles = ['admin']
          }
        }
        // Generate name from firstName and lastName
        if (data?.firstName || data?.lastName) {
          data.name = `${data.firstName || ''} ${data.lastName || ''}`.trim()
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
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
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: {
        update: ({ req: { user } }) => {
          return Boolean(user?.roles?.includes('admin'))
        },
      },
      admin: {
        description: 'Admin has full access, Editor can create/edit content',
        condition: ({ user }) => {
          return Boolean(user?.roles?.includes('admin'))
        },
      },
    },
  ],
}
