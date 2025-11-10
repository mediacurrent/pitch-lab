import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'thisOrThatInstance',
  title: 'This or That',
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
      name: 'timerLength',
      title: 'Timer Length (seconds)',
      type: 'number',
      validation: (Rule) => Rule.required().min(5).max(60),
      initialValue: 10,
    }),
    defineField({
      name: 'imagePairs',
      title: 'Image Pairs',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Pair Title',
              type: 'string',
              validation: (Rule) => Rule.required().min(1).max(100),
            },
            {
              name: 'image1',
              title: 'Image 1 (This)',
              type: 'object',
              fields: [
                {
                  name: 'asset',
                  title: 'Image Asset',
                  type: 'image',
                  options: {
                    hotspot: true,
                  },
                },
                {
                  name: 'externalUrl',
                  title: 'External URL',
                  type: 'url',
                  description: 'Alternative to uploaded image',
                },
                {
                  name: 'altText',
                  title: 'Alt Text',
                  type: 'string',
                  description: 'Accessibility description',
                },
              ],
              validation: (Rule) => Rule.custom((fields: any) => {
                if (!fields?.asset && !fields?.externalUrl) {
                  return 'Either an image asset or external URL is required'
                }
                return true
              }),
            },
            {
              name: 'image2',
              title: 'Image 2 (That)',
              type: 'object',
              fields: [
                {
                  name: 'asset',
                  title: 'Image Asset',
                  type: 'image',
                  options: {
                    hotspot: true,
                  },
                },
                {
                  name: 'externalUrl',
                  title: 'External URL',
                  type: 'url',
                  description: 'Alternative to uploaded image',
                },
                {
                  name: 'altText',
                  title: 'Alt Text',
                  type: 'string',
                  description: 'Accessibility description',
                },
              ],
              validation: (Rule) => Rule.custom((fields: any) => {
                if (!fields?.asset && !fields?.externalUrl) {
                  return 'Either an image asset or external URL is required'
                }
                return true
              }),
            },
            {
              name: 'order',
              title: 'Order',
              type: 'number',
              description: 'Order in which this pair appears',
              validation: (Rule) => Rule.required().integer().positive(),
            },
          ],
          preview: {
            select: {
              title: 'title',
              image1: 'image1.asset',
              image2: 'image2.asset',
              order: 'order',
            },
            prepare({ title, image1, image2, order }) {
              return {
                title: title || `Pair ${order || 'Untitled'}`,
                subtitle: `Order: ${order || 'Not set'}`,
                media: image1 || image2,
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
      timerLength: 'timerLength',
      pairCount: 'imagePairs',
    },
    prepare({ title, timerLength, pairCount }) {
      return {
        title: title || 'Untitled',
        subtitle: `${pairCount?.length || 0} pairs • ${timerLength}s timer`,
      }
    },
  },
}) 