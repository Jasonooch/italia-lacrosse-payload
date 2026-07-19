import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const Projects: CollectionConfig = {
  slug: 'projects',
  timestamps: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'owner', 'dueDate', 'updatedAt'],
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
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'not-started',
      options: [
        { label: 'Not Started', value: 'not-started' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'On Hold', value: 'on-hold' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          admin: { width: '50%' },
        },
        {
          name: 'dueDate',
          type: 'date',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'tournament',
      type: 'relationship',
      relationTo: 'tournaments',
      admin: {
        description: 'The tournament this project supports, if any.',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
    },
    {
      name: 'resources',
      type: 'array',
      labels: { singular: 'Resource', plural: 'Resources' },
      admin: {
        description: 'Links (Google Sheets, Drive docs) or uploaded files the team is using.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          admin: {
            description: 'Link to an external resource (Google Sheet, Drive PDF, etc.).',
          },
        },
        {
          name: 'file',
          type: 'upload',
          relationTo: 'project-files',
          admin: {
            description: 'Or attach an uploaded file instead of a link.',
          },
        },
      ],
    },
    {
      name: 'milestones',
      type: 'array',
      labels: { singular: 'Milestone', plural: 'Milestones' },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'not-started',
          options: [
            { label: 'Not Started', value: 'not-started' },
            { label: 'In Progress', value: 'in-progress' },
            { label: 'Completed', value: 'completed' },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'dueDate',
              type: 'date',
              admin: { width: '50%' },
            },
            {
              name: 'assignee',
              type: 'relationship',
              relationTo: 'users',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
  ],
}
