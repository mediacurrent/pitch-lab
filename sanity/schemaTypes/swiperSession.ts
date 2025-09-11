import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'swiperSession',
  title: 'Swiper Session',
  type: 'document',
  fields: [
    defineField({
      name: 'sessionId',
      title: 'Session ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'swiperInstance',
      title: 'Swiper Instance',
      type: 'reference',
      to: [{ type: 'swiperInstance' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'keptWebsites',
      title: 'Kept Websites',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'killedWebsites',
      title: 'Killed Websites',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'skippedWebsites',
      title: 'Skipped Websites',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'totalTime',
      title: 'Total Time (seconds)',
      type: 'number',
    }),
    defineField({
      name: 'userAgent',
      title: 'User Agent',
      type: 'string',
    }),
    defineField({
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      sessionId: 'sessionId',
      timestamp: 'timestamp',
      keptCount: 'keptWebsites',
      killedCount: 'killedWebsites',
      skippedCount: 'skippedWebsites',
    },
    prepare({ sessionId, timestamp, keptCount, killedCount, skippedCount }) {
      const date = timestamp ? new Date(timestamp).toLocaleDateString() : 'Unknown date'
      return {
        title: `Session ${sessionId?.slice(0, 8) || 'Unknown'}`,
        subtitle: `${date} • Keep: ${keptCount?.length || 0}, Kill: ${killedCount?.length || 0}, Skip: ${skippedCount?.length || 0}`,
      }
    },
  },
})
