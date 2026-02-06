import type { CollectionConfig } from 'payload'

export const FillInTheBlank: CollectionConfig = {
  slug: 'fill-in-the-blank',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
    description: 'Fill in the blank activities. Add new questions inline or select from previously saved questions.',
  },
  access: {
    create: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
    delete: ({ req }) => (req.user as { userType?: string })?.userType === 'admin',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Title of this fill-in-the-blank activity' },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description: 'Each item is either a new question (write below) or a previously saved question (select from list).',
      },
      fields: [
        {
          name: 'source',
          type: 'select',
          required: true,
          options: [
            { label: 'Write new question', value: 'new' },
            { label: 'Use saved question', value: 'saved' },
          ],
          defaultValue: 'new',
          admin: { description: 'Add a new question or pick one you saved earlier' },
        },
        {
          name: 'newText',
          type: 'textarea',
          admin: {
            description: 'The sentence with a blank (e.g. use _____ for the gap).',
            condition: (_data, siblingData) => siblingData?.source === 'new',
          },
        },
        {
          name: 'savedQuestion',
          type: 'relationship',
          relationTo: 'questions-bank',
          admin: {
            description: 'Choose a question from the Questions Bank.',
            condition: (_data, siblingData) => siblingData?.source === 'saved',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data?.items || !Array.isArray(data.items)) return data
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i]
          if (!item || typeof item !== 'object') continue
          const source = (item as { source?: string }).source
          const newText = (item as { newText?: string }).newText
          const savedQuestion = (item as { savedQuestion?: string | object }).savedQuestion
          if (source === 'new' && !newText?.trim()) {
            throw new Error(`Item ${i + 1}: please enter the question text when "Write new question" is selected.`)
          }
          if (source === 'saved' && !savedQuestion) {
            throw new Error(`Item ${i + 1}: please select a saved question when "Use saved question" is selected.`)
          }
        }
        return data
      },
    ],
  },
  timestamps: true,
}
