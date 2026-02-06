/**
 * One-off script to make the existing user an admin and fix required fields.
 * Run from apps/cms: pnpm run fix-user
 * Or: npx tsx scripts/fix-first-user.ts
 * Ensure .env has DATABASE_URI and PAYLOAD_SECRET (or run from apps/cms so .env is present).
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

const USER_ID = '698632eceb4f75667f025b27' // replace if your user id is different

async function main() {
  const payload = await getPayload({ config })
  const companies = await payload.find({
    collection: 'companies',
    limit: 1,
    overrideAccess: true,
  })
  const companyId = companies.docs[0]?.id
  if (!companyId) {
    console.error('No company found. Create a company in the admin first, then run this script.')
    process.exit(1)
  }
  const user = await payload.findByID({
    collection: 'users',
    id: USER_ID,
    overrideAccess: true,
  }) as { id: string; firstName?: string; lastName?: string; company?: string | { id: string }; userType?: string }
  const updateData: Record<string, unknown> = {
    userType: 'admin',
    company: typeof user.company === 'object' && user.company !== null ? (user.company as { id: string }).id : user.company || companyId,
    lastName: user.lastName || 'Admin',
    firstName: user.firstName || 'Admin',
  }
  await payload.update({
    collection: 'users',
    id: USER_ID,
    data: updateData,
    overrideAccess: true,
  })
  console.log('User updated to admin with company and name set. You can now log in and create/edit users.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
