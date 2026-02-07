import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig } from 'payload'
import { Companies } from './collections/Companies'
import { ContentRank } from './collections/ContentRank'
import { CsvUploads } from './collections/CsvUploads'
import { FillInTheBlank } from './collections/FillInTheBlank'
import { QuestionsBank } from './collections/QuestionsBank'
import { ImageChoiceAssessments } from './collections/ImageChoiceAssessments'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Required for production: OG images, API, login. Set PAYLOAD_PUBLIC_SERVER_URL to your canonical URL (e.g. https://pitch-lab-cms.vercel.app) so OG requests are same-origin and not blocked by CORS.
const serverURL =
  process.env.PAYLOAD_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  'http://localhost:3001'

export default buildConfig({
  serverURL,
  endpoints: [
    {
      path: '/content-rank-by-token',
      method: 'get',
      handler: async (req) => {
        const url = new URL(req.url || '', 'http://localhost')
        const id = url.searchParams.get('id')
        const token = url.searchParams.get('token')
        if (!id || !token) {
          return Response.json({ error: 'id and token required' }, { status: 400 })
        }
        const doc = await req.payload.findByID({
          collection: 'content-rank',
          id,
          overrideAccess: true,
        })
        if (!doc || (doc as { accessToken?: string }).accessToken !== token) {
          return Response.json({ error: 'Not found' }, { status: 404 })
        }
        if (!(doc as { isActive?: boolean }).isActive) {
          return Response.json({ error: 'Not found' }, { status: 404 })
        }
        return Response.json(doc)
      },
    },
  ],
  admin: {
    meta: {
      titleSuffix: ' | Site CMS',
    },
  },
  collections: [Companies, Users, Media, CsvUploads, ImageChoiceAssessments, ContentRank, QuestionsBank, FillInTheBlank],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'change-me-in-production',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/payload-turbo',
    connectOptions: {
      serverSelectionTimeoutMS: 15000,
      // Prefer TLS 1.2+ for Atlas (avoids TLS "internal error" from serverless runtimes)
      ...(process.env.DATABASE_URI?.startsWith('mongodb+srv://') || process.env.MONGODB_URI?.startsWith('mongodb+srv://')
        ? { tls: true }
        : {}),
    },
    // Disable transactions to avoid "Write conflict during plan execution" on Atlas (M0/shared tier)
    transactionOptions: false,
  }),
  sharp,
})
