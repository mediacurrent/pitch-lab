import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'imageOption',
  title: 'Image Option',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: 'image1',
      title: 'Image This',
      type: 'image',
      options: {
        hotspot: true,
        accept: 'image/*',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image2',
      title: 'Image That',
      type: 'image',
      options: {
        hotspot: true,
        accept: 'image/*',
      },
      validation: (Rule) => Rule.required(),
    }),
                defineField({
              name: 'category',
              title: 'Category',
              type: 'reference',
              to: [{ type: 'category' }],
              validation: (Rule) => Rule.required(),
            }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Draft', value: 'draft' },
          { title: 'Archived', value: 'archived' },
        ],
      },
      initialValue: 'active',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'metadata',
      title: 'Image Metadata',
      type: 'object',
      fields: [
        {
          name: 'altText1',
          title: 'Alt Text for Image This',
          type: 'string',
          description: 'Accessibility description for the "This" image',
          validation: (Rule) => Rule.max(200),
        },
        {
          name: 'altText2',
          title: 'Alt Text for Image That',
          type: 'string',
          description: 'Accessibility description for the "That" image',
          validation: (Rule) => Rule.max(200),
        },
        {
          name: 'credit',
          title: 'Image Credit',
          type: 'string',
          description: 'Photographer or source attribution',
        },
        {
          name: 'location',
          title: 'Location',
          type: 'string',
          description: 'Where the images were taken',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image1',
      category: 'category',
      status: 'status',
    },
    prepare(selection) {
      const { title, media, category, status } = selection
      const statusEmoji = status === 'active' ? '✅' : status === 'draft' ? '📝' : '📦'
      return {
        title: title,
        subtitle: `${statusEmoji} ${category || 'No category'} | ${status}`,
        media: media,
      }
    },
  },
  orderings: [
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
    {
      title: 'Title Z-A',
      name: 'titleDesc',
      by: [{ field: 'title', direction: 'desc' }],
    },
    {
      title: 'Status',
      name: 'statusOrder',
      by: [{ field: 'status', direction: 'asc' }],
    },
  ],
}) 