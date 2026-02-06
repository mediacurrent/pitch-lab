import type { CollectionConfig } from 'payload'

export const QuestionsBank: CollectionConfig = {
  slug: 'questions-bank',
  labels: {
    singular: 'Question Bank',
    plural: 'Question Bank',
  },
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['text', 'updatedAt'],
    description: 'Reusable fill-in-the-blank prompts (questions bank). Use _____ or [blank] for the gap. Admins can select these when building a Fill in the Blank activity.',
  },
  access: {
    create: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
    delete: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
  },
  fields: [
    {
      name: 'text',
      type: 'textarea',
      required: true,
      admin: {
        description: 'The sentence with a blank. Use _____ or [blank] where the user fills in the answer.',
      },
    },
  ],
  timestamps: true,
}
