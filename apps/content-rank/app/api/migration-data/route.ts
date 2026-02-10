import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'

const PREFIX = 'nysid_migration_analysis_'
const SUFFIX = '.csv'
const CMS_URL = process.env.CMS_URL || 'http://localhost:3001'
const SESSION_SECRET = process.env.MIGRATION_SESSION_API_SECRET

const LIB_DIRS = [
  join(process.cwd(), 'lib'),
  join(process.cwd(), 'apps', 'content-rank', 'lib'),
]

function cmsUrl(path: string): string {
  const base = CMS_URL.replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/** Proxy migration session GET to CMS */
async function handleSessionGet(sessionId: string | null, email: string | null): Promise<NextResponse> {
  if (!SESSION_SECRET) {
    return NextResponse.json(
      { error: 'Migration session API not configured (missing MIGRATION_SESSION_API_SECRET)' },
      { status: 503 }
    )
  }
  if (!sessionId && !email) {
    return NextResponse.json({ error: 'sessionId or email required' }, { status: 400 })
  }
  const params = new URLSearchParams()
  if (sessionId) params.set('sessionId', sessionId)
  if (email) params.set('email', email)
  const sessionUrl = cmsUrl(`/api/migration-session?${params}`)
  try {
    const res = await fetch(sessionUrl, {
      headers: { 'x-migration-session-secret': SESSION_SECRET },
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    if (res.status === 404) {
      console.error('[migration-session GET] CMS returned 404 for', sessionUrl, '- check CMS_URL')
      return NextResponse.json(
        { error: 'Session not found or CMS endpoint missing. Check CMS_URL in production.' },
        { status: 502 }
      )
    }
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CMS request failed'
    console.error('[migration-session GET]', message)
    return NextResponse.json(
      { error: 'Cannot reach CMS. Is it running?', details: message },
      { status: 502 }
    )
  }
}

/** Proxy migration session POST to CMS */
async function handleSessionPost(body: unknown): Promise<NextResponse> {
  if (!SESSION_SECRET) {
    return NextResponse.json(
      { error: 'Migration session API not configured (missing MIGRATION_SESSION_API_SECRET)' },
      { status: 503 }
    )
  }
  const sessionUrl = cmsUrl('/api/migration-session')
  try {
    const res = await fetch(sessionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-migration-session-secret': SESSION_SECRET,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    if (res.status === 404) {
      console.error('[migration-session POST] CMS returned 404 for', sessionUrl, '- check CMS_URL and that the CMS app is deployed with the migration-session endpoint')
      return NextResponse.json(
        {
          error: 'Session service not found. In production, set CMS_URL to your deployed CMS and ensure the CMS is deployed with the migration-session API.',
          details: 'CMS returned 404',
        },
        { status: 502 }
      )
    }
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CMS request failed'
    console.error('[migration-session POST]', sessionUrl, message)
    return NextResponse.json(
      { error: 'Cannot reach CMS. Is it running?', details: message },
      { status: 502 }
    )
  }
}

/** Discover available versions by scanning lib for PREFIX*vSUFFIX files. */
async function getAvailableVersions(): Promise<string[]> {
  const versionSet = new Set<string>()
  for (const dir of LIB_DIRS) {
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      for (const e of entries) {
        if (!e.isFile() || !e.name.startsWith(PREFIX) || !e.name.endsWith(SUFFIX)) continue
        const version = e.name.slice(PREFIX.length, -SUFFIX.length)
        if (version) versionSet.add(version)
      }
    } catch {
      continue
    }
  }
  return Array.from(versionSet).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
}

/** Resolve path to a specific version's CSV. */
function getPathForVersion(version: string): string[] {
  const filename = `${PREFIX}${version}${SUFFIX}`
  return LIB_DIRS.map((dir) => join(dir, filename))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const sessionId = searchParams.get('sessionId')?.trim() || null
  const email = searchParams.get('email')?.trim() || null
  if ((sessionId || email) && !searchParams.get('list')) {
    return handleSessionGet(sessionId, email)
  }

  if (searchParams.get('list') === '1') {
    const versions = await getAvailableVersions()
    return NextResponse.json({ versions })
  }

  const version = searchParams.get('version')?.trim() || null
  const candidates = version
    ? getPathForVersion(version)
    : [
        ...(await getAvailableVersions()).flatMap((v) => getPathForVersion(v)),
        join(process.cwd(), 'lib', `${PREFIX}v2${SUFFIX}`),
        join(process.cwd(), 'apps', 'content-rank', 'lib', `${PREFIX}v2${SUFFIX}`),
      ]

  for (const filePath of candidates) {
    try {
      const csv = await readFile(filePath, 'utf-8')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
        },
      })
    } catch {
      continue
    }
  }

  return NextResponse.json(
    {
      error: version
        ? `Migration data file not found for version "${version}". Add ${PREFIX}${version}${SUFFIX} to lib/ or apps/content-rank/lib/`
        : `No migration data file found. Add ${PREFIX}v2${SUFFIX} (or another version) to lib/ or apps/content-rank/lib/`,
    },
    { status: 404 }
  )
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const obj = body && typeof body === 'object' ? body as Record<string, unknown> : null
  if (obj && ('email' in obj || 'sessionId' in obj)) {
    return handleSessionPost(body)
  }
  return NextResponse.json({ error: 'Session payload (email or sessionId) required' }, { status: 400 })
}
