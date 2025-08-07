import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'votingSession',
  title: 'This or That Session',
  type: 'document',
  fields: [
    defineField({
      name: 'userName',
      title: 'User Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: 'instanceId',
      title: 'Instance ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'instanceTitle',
      title: 'Instance Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sessionDate',
      title: 'Session Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
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
              name: 'imagePairTitle',
              title: 'Image Pair Title',
              type: 'string',
            },
            {
              name: 'imageUrl1',
              title: 'Image 1 URL',
              type: 'url',
            },
            {
              name: 'imageUrl2',
              title: 'Image 2 URL',
              type: 'url',
            },
            {
              name: 'selectedImage',
              title: 'Selected Image',
              type: 'string',
              options: {
                list: [
                  { title: 'Image 1 (This)', value: 'left' },
                  { title: 'Image 2 (That)', value: 'right' },
                  { title: 'Timed Out', value: 'timeout' },
                ],
              },
            },
            {
              name: 'timeSpent',
              title: 'Time Spent (seconds)',
              type: 'number',
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'summary',
      title: 'Voting Summary',
      type: 'object',
      fields: [
        {
          name: 'totalVotes',
          title: 'Total Votes',
          type: 'number',
        },
        {
          name: 'leftVotes',
          title: 'This Votes',
          type: 'number',
        },
        {
          name: 'rightVotes',
          title: 'That Votes',
          type: 'number',
        },
        {
          name: 'timeoutVotes',
          title: 'Timeout Votes',
          type: 'number',
        },
        {
          name: 'averageTimePerVote',
          title: 'Average Time Per Vote (seconds)',
          type: 'number',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'userName',
      subtitle: 'instanceTitle',
      date: 'sessionDate',
      voteCount: 'summary.totalVotes',
    },
    prepare({ title, subtitle, date, voteCount }) {
      return {
        title: title || 'Anonymous User',
        subtitle: `${subtitle || 'Unknown Instance'} • ${voteCount || 0} votes`,
      }
    },
  },
}) 