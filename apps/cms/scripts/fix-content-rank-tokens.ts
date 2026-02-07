/**
 * One-off script to add accessToken to Content Rank instances that don't have one.
 * Run from apps/cms: pnpm run fix-content-rank-tokens
 * Or: npx tsx scripts/fix-content-rank-tokens.ts
 */
import 'dotenv/config'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '../payload.config'

function generateAccessToken() {
  return crypto.randomBytes(24).toString('base64url')
}

async function main() {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'content-rank',
    limit: 500,
    overrideAccess: true,
  })

  let updated = 0
  for (const doc of result.docs) {
    const d = doc as { id: string; accessToken?: string | null }
    if (!d.accessToken) {
      await payload.update({
        collection: 'content-rank',
        id: d.id,
        data: { accessToken: generateAccessToken() },
        overrideAccess: true,
      })
      updated++
      console.log(`Updated Content Rank ${d.id}`)
    }
  }

  console.log(`Done. Updated ${updated} instance(s).`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
