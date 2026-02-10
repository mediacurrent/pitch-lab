import { getPayload } from 'payload'
import config from '@payload-config'
import { handleMigrationSessionGet, handleMigrationSessionPost } from '../../../../lib/migration-session'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  return handleMigrationSessionGet(payload, request)
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  return handleMigrationSessionPost(payload, request)
}
