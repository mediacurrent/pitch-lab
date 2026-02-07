import type { CollectionConfig } from 'payload'

export const Companies: CollectionConfig = {
  slug: 'companies',
  access: {
    read: () => true,
    create: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
    update: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
    delete: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Company name',
      },
    },
  ],
  timestamps: true,
}
