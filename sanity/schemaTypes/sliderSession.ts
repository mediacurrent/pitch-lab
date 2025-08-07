import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'sliderSession',
  title: 'Slider Session',
  type: 'document',
  fields: [
    defineField({
      name: 'sessionId',
      title: 'Session ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sliderInstance',
      title: 'Slider Instance',
      type: 'reference',
      to: [{ type: 'sliderInstance' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startTime',
      title: 'Start Time',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endTime',
      title: 'End Time',
      type: 'datetime',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Completed', value: 'completed' },
          { title: 'Paused', value: 'paused' },
        ],
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'active',
    }),
    defineField({
      name: 'votes',
      title: 'Votes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'pairTitle',
              title: 'Pair Title',
              type: 'string',
            },
            {
              name: 'leftSide',
              title: 'Left Side',
              type: 'string',
            },
            {
              name: 'rightSide',
              title: 'Right Side',
              type: 'string',
            },
            {
              name: 'selectedSide',
              title: 'Selected Side',
              type: 'string',
              options: {
                list: [
                  { title: 'Left', value: 'left' },
                  { title: 'Right', value: 'right' },
                ],
              },
            },
            {
              name: 'timestamp',
              title: 'Timestamp',
              type: 'datetime',
            },
            {
              name: 'timeSpent',
              title: 'Time Spent (seconds)',
              type: 'number',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'metadata',
      title: 'Session Metadata',
      type: 'object',
      fields: [
        {
          name: 'userAgent',
          title: 'User Agent',
          type: 'string',
        },
        {
          name: 'ipAddress',
          title: 'IP Address',
          type: 'string',
        },
        {
          name: 'referrer',
          title: 'Referrer',
          type: 'string',
        },
        {
          name: 'totalPairs',
          title: 'Total Pairs',
          type: 'number',
        },
        {
          name: 'completedPairs',
          title: 'Completed Pairs',
          type: 'number',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'sessionId',
      sliderTitle: 'sliderInstance.title',
      status: 'status',
      startTime: 'startTime',
      voteCount: 'votes',
    },
    prepare({ title, sliderTitle, status, startTime, voteCount }) {
      const count = voteCount?.length || 0
      const date = startTime ? new Date(startTime).toLocaleDateString() : 'No date'
      return {
        title: title || 'Untitled Session',
        subtitle: `${sliderTitle || 'Unknown Slider'} • ${status} • ${count} votes • ${date}`,
      }
    },
  },
})
