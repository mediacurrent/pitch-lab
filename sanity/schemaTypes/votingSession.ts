import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'votingSession',
  title: 'Voting Session',
  type: 'document',
  fields: [
    defineField({
      name: 'sessionId',
      title: 'Session ID',
      type: 'string',
      description: 'Unique identifier for this voting session',
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
      initialValue: 'active',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'totalVotes',
      title: 'Total Votes',
      type: 'number',
      description: 'Total number of votes cast in this session',
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'totalImages',
      title: 'Total Images',
      type: 'number',
      description: 'Total number of images in this session',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'completedImages',
      title: 'Completed Images',
      type: 'number',
      description: 'Number of images that have been voted on',
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'averageTimePerVote',
      title: 'Average Time Per Vote',
      type: 'number',
      description: 'Average time in seconds spent on each vote',
      validation: (Rule) => Rule.min(0),
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
              name: 'imageId',
              title: 'Image ID',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'imageTitle',
              title: 'Image Title',
              type: 'string',
            },
            {
              name: 'vote',
              title: 'Vote',
              type: 'string',
              options: {
                list: [
                  { title: 'This', value: 'this' },
                  { title: 'That', value: 'that' },
                  { title: 'Timeout', value: 'timeout' },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'timestamp',
              title: 'Timestamp',
              type: 'datetime',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'timeSpent',
              title: 'Time Spent (seconds)',
              type: 'number',
              validation: (Rule) => Rule.min(0),
            },
          ],
        },
      ],
      readOnly: true,
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
          description: 'Browser/device information',
        },
        {
          name: 'ipAddress',
          title: 'IP Address',
          type: 'string',
          description: 'User IP address (anonymized)',
        },
        {
          name: 'referrer',
          title: 'Referrer',
          type: 'string',
          description: 'Where the user came from',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'sessionId',
      startTime: 'startTime',
      status: 'status',
      totalVotes: 'totalVotes',
      totalImages: 'totalImages',
    },
    prepare(selection) {
      const { title, startTime, status, totalVotes, totalImages } = selection
      const statusEmoji = status === 'active' ? '🟢' : status === 'completed' ? '✅' : '⏸️'
      const date = startTime ? new Date(startTime).toLocaleDateString() : 'No date'
      return {
        title: `${statusEmoji} ${title}`,
        subtitle: `${date} | ${totalVotes} votes / ${totalImages} images`,
      }
    },
  },
  orderings: [
    {
      title: 'Start Time (Newest)',
      name: 'startTimeDesc',
      by: [{ field: 'startTime', direction: 'desc' }],
    },
    {
      title: 'Start Time (Oldest)',
      name: 'startTimeAsc',
      by: [{ field: 'startTime', direction: 'asc' }],
    },
    {
      title: 'Total Votes',
      name: 'totalVotesDesc',
      by: [{ field: 'totalVotes', direction: 'desc' }],
    },
  ],
}) 