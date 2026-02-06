import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig } from 'payload'
import { Companies } from './collections/Companies'
import { FillInTheBlank } from './collections/FillInTheBlank'
import { QuestionsBank } from './collections/QuestionsBank'
import { ImageChoiceAssessments } from './collections/ImageChoiceAssessments'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    meta: {
      titleSuffix: ' | Site CMS',
    },
  },
  collections: [Companies, Users, Media, ImageChoiceAssessments, QuestionsBank, FillInTheBlank],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'change-me-in-production',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/payload-turbo',
  }),
  sharp,
})
