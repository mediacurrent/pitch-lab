import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'imageVoting',
  title: 'Image Voting',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: 'image',
      title: 'Image',
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
      type: 'string',
      options: {
        list: [
          { title: 'Nature', value: 'nature' },
          { title: 'Architecture', value: 'architecture' },
          { title: 'Food', value: 'food' },
          { title: 'Travel', value: 'travel' },
          { title: 'Art', value: 'art' },
          { title: 'Technology', value: 'technology' },
          { title: 'People', value: 'people' },
          { title: 'Animals', value: 'animals' },
          { title: 'Sports', value: 'sports' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      validation: (Rule) => Rule.max(10),
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
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Mark this image as featured for special display',
      initialValue: false,
    }),
    defineField({
      name: 'difficulty',
      title: 'Voting Difficulty',
      type: 'string',
      description: 'How challenging this image might be to vote on',
      options: {
        list: [
          { title: 'Easy', value: 'easy' },
          { title: 'Medium', value: 'medium' },
          { title: 'Hard', value: 'hard' },
        ],
      },
      initialValue: 'medium',
    }),
    defineField({
      name: 'metadata',
      title: 'Image Metadata',
      type: 'object',
      fields: [
        {
          name: 'altText',
          title: 'Alt Text',
          type: 'string',
          description: 'Accessibility description for the image',
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
          description: 'Where the image was taken',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      category: 'category',
      status: 'status',
      featured: 'featured',
    },
    prepare(selection) {
      const { title, media, category, status, featured } = selection
      const statusEmoji = status === 'active' ? '✅' : status === 'draft' ? '📝' : '📦'
      const featuredIcon = featured ? '⭐ ' : ''
      return {
        title: `${featuredIcon}${title}`,
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
      title: 'Featured First',
      name: 'featuredFirst',
      by: [
        { field: 'featured', direction: 'desc' },
        { field: 'title', direction: 'asc' },
      ],
    },
    {
      title: 'Status',
      name: 'statusOrder',
      by: [{ field: 'status', direction: 'asc' }],
    },
  ],
}) 