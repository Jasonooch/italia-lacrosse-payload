import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

// System-generated feed of what changed on a project (status, team, milestones,
// resources). Written by the `logActivity` helper from inside the project
// server actions, which know the exact semantics a generic afterChange hook
// would lose. Merged with `comments` in the project Activity tab by `createdAt`.
export const ActivityLog: CollectionConfig = {
  slug: 'activity-log',
  timestamps: true,
  admin: {
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'project', 'actor', 'createdAt'],
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
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      index: true,
    },
    {
      name: 'actor',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Who made the change. Empty for system-triggered entries.',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Project created', value: 'project-created' },
        { label: 'Status changed', value: 'status-changed' },
        { label: 'Team changed', value: 'team-changed' },
        { label: 'Milestone added', value: 'milestone-added' },
        { label: 'Milestone completed', value: 'milestone-completed' },
        { label: 'Milestone updated', value: 'milestone-updated' },
        { label: 'Resource added', value: 'resource-added' },
      ],
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
      admin: {
        description: 'Human-readable sentence, e.g. "changed status to Completed".',
      },
    },
  ],
}
