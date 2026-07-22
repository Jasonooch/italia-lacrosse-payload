import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { ownRowOrAdmin } from '../access/ownRowOrAdmin'

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
    // Anyone signed in can create (the `notify` helper writes rows for other
    // recipients as the acting user), but a notification is otherwise private
    // to its recipient: nobody else can read it, mark it read, or delete it.
    create: authenticated,
    delete: ownRowOrAdmin('recipient'),
    read: ownRowOrAdmin('recipient'),
    update: ownRowOrAdmin('recipient'),
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (req.user && !req.user.roles?.includes('admin')) {
          // The actor is always whoever is making the request — prevents
          // spoofing "X mentioned you" rows via the REST API.
          if (operation === 'create') data.actor = req.user.id
          // A recipient may only flip their own row's `read` flag, not hand
          // the row (or its attribution) to someone else.
          else {
            delete data.recipient
            delete data.actor
          }
        }
        return data
      },
    ],
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
      name: 'contact',
      type: 'relationship',
      relationTo: 'contacts',
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
      name: 'contactNote',
      type: 'relationship',
      relationTo: 'contact-notes',
      admin: {
        description: 'The contact note this notification points at, for mention types.',
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
