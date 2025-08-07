import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'sliderInstance',
  title: 'Slider',
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
      name: 'sliderPairs',
      title: 'Slider Pairs',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'sliderPair',
          fields: [
            {
              name: 'title',
              title: 'Pair Title',
              type: 'string',
              validation: (Rule) => Rule.required().min(1).max(100),
            },
            {
              name: 'leftSide',
              title: 'Left Side',
              type: 'string',
              validation: (Rule) => Rule.required().min(1).max(100),
            },
            {
              name: 'rightSide',
              title: 'Right Side',
              type: 'string',
              validation: (Rule) => Rule.required().min(1).max(100),
            },
          ],
          preview: {
            select: {
              title: 'title',
              leftSide: 'leftSide',
              rightSide: 'rightSide',
            },
            prepare({ title, leftSide, rightSide }) {
              return {
                title: title || 'Untitled Pair',
                subtitle: `${leftSide} vs ${rightSide}`,
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'createdBy',
      title: 'Created By',
      type: 'string',
      readOnly: true,
    }),

  ],
  preview: {
    select: {
      title: 'title',
      pairCount: 'sliderPairs',
      isActive: 'isActive',
    },
    prepare({ title, pairCount, isActive }) {
      const count = pairCount?.length || 0
      return {
        title: title || 'Untitled Slider',
        subtitle: `${count} pair${count !== 1 ? 's' : ''} • ${isActive ? 'Active' : 'Inactive'}`,
      }
    },
  },
})
