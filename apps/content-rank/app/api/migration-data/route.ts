import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'

const PREFIX = 'nysid_migration_analysis_'
const SUFFIX = '.csv'

const LIB_DIRS = [
  join(process.cwd(), 'lib'),
  join(process.cwd(), 'apps', 'content-rank', 'lib'),
]

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
