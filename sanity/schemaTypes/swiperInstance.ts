import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'swiperInstance',
  title: 'Swiper',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'websites',
      title: 'Websites',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'id',
              title: 'ID',
              type: 'number',
              validation: (Rule) => Rule.required().integer().positive(),
            },
            {
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (Rule) => Rule.required().min(1).max(100),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'string',
              validation: (Rule) => Rule.required().min(1).max(200),
            },
            {
              name: 'cms',
              title: 'Technology/CMS',
              type: 'string',
              validation: (Rule) => Rule.required().min(1).max(50),
            },
            {
              name: 'dept',
              title: 'Department',
              type: 'string',
              validation: (Rule) => Rule.required().min(1).max(50),
            },
            {
              name: 'category',
              title: 'Category',
              type: 'string',
              validation: (Rule) => Rule.required().min(1).max(50),
            },
            {
              name: 'order',
              title: 'Order',
              type: 'number',
              description: 'Order in which this website appears',
              validation: (Rule) => Rule.required().integer().positive(),
            },
          ],
          preview: {
            select: {
              name: 'name',
              description: 'description',
              order: 'order',
            },
            prepare({ name, description, order }) {
              return {
                title: name || `Website ${order || 'Untitled'}`,
                subtitle: description || 'No description',
                media: '🌐',
              }
            },
          },
        }
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Whether this instance is active and can be accessed',
      initialValue: true,
    }),
    defineField({
      name: 'createdBy',
      title: 'Created By',
      type: 'string',
      description: 'CMS user who created this instance',
      readOnly: true,
      initialValue: ({ currentUser }: any) => currentUser?.name || currentUser?.email || 'Unknown',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      websiteCount: 'websites',
    },
    prepare({ title, websiteCount }) {
      return {
        title: title || 'Untitled',
        subtitle: `${websiteCount?.length || 0} websites`,
      }
    },
  },
})
