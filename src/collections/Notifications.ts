import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

// Per-recipient inbox items. One row is created for each person who should hear
// about something: an @-mention, a new comment on a project they're on, or a
// change to that project. Written by the `notify` helper from the project
// server actions / logActivity. The dashboard nav badge counts unread rows for
// the current user; opening an item (or "mark all read") flips `read`.
export const Notifications: CollectionConfig = {
  slug: 'notifications',
  timestamps: true,
  admin: {
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'recipient', 'type', 'read', 'createdAt'],
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
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Mention', value: 'mention' },
        { label: 'Comment', value: 'comment' },
        { label: 'Project activity', value: 'project-activity' },
      ],
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      index: true,
    },
    {
      name: 'actor',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Who triggered this notification.',
      },
    },
    {
      name: 'comment',
      type: 'relationship',
      relationTo: 'comments',
      admin: {
        description: 'The comment this notification points at, for mention/comment types.',
      },
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
      admin: {
        description: 'Display sentence, e.g. "mentioned you in Fall Fundraising".',
      },
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
  ],
}
