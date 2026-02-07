import type { CollectionConfig } from 'payload'

export const CsvUploads: CollectionConfig = {
  slug: 'csv-uploads',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'mimeType', 'filesize', 'updatedAt'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
    update: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
    delete: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
  },
  upload: {
    staticDir: 'csv-uploads',
    mimeTypes: ['text/csv', 'text/plain', 'application/csv', 'text/comma-separated-values'],
  },
  fields: [],
  timestamps: true,
}
