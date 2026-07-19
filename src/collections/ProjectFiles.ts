import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/** Staff-only file attachments for dashboard projects (PDFs, docs, sheets).
 * Kept separate from `media`, which is image-only, admin-managed, and publicly
 * readable because it backs the public site. */
export const ProjectFiles: CollectionConfig = {
  slug: 'project-files',
  timestamps: true,
  admin: {
    group: 'Admin',
    description: 'Files attached to dashboard projects.',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  fields: [],
  upload: {
    mimeTypes: [
      'application/pdf',
      'image/*',
      'text/csv',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    // Documents only — no derived image sizes needed.
    imageSizes: [],
  },
}
