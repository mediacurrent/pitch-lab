export default {
  name: 'imageVoting',
  title: 'Image Voting',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
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
          { title: 'Other', value: 'other' },
        ],
      },
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      category: 'category',
    },
    prepare(selection: any) {
      const { title, media, category } = selection
      return {
        title: title,
        subtitle: category ? `Category: ${category}` : 'No category',
        media: media,
      }
    },
  },
} 