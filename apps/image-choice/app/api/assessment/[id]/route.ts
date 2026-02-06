import { NextResponse } from 'next/server'

const CMS_URL = process.env.CMS_URL || 'http://localhost:3001'

function rewriteMediaUrls(obj: unknown, baseUrl: string): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') return obj
  if (Array.isArray(obj)) return obj.map((item) => rewriteMediaUrls(item, baseUrl))
  if (typeof obj === 'object') {
    const record = obj as Record<string, unknown>
    if (typeof record.url === 'string' && record.url.startsWith('/')) {
      return { ...record, url: `${baseUrl.replace(/\/$/, '')}${record.url}` }
    }
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(record)) {
      out[k] = rewriteMediaUrls(v, baseUrl)
    }
    return out
  }
  return obj
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Missing assessment id' }, { status: 400 })

  try {
    const res = await fetch(
      `${CMS_URL}/api/image-choice-assessments/${id}?depth=2`,
      { next: { revalidate: 0 } },
    )
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: res.status === 404 ? 'Assessment not found' : text || res.statusText },
        { status: res.status },
      )
    }
    const data = await res.json()
    const rewritten = rewriteMediaUrls(data, CMS_URL) as typeof data
    return NextResponse.json(rewritten)
  } catch (err) {
    console.error('Assessment fetch error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load assessment' },
      { status: 502 },
    )
  }
}
