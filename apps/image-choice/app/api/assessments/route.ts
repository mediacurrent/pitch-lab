import { NextResponse } from 'next/server'

const CMS_URL = process.env.CMS_URL || 'http://localhost:3001'

export async function GET() {
  try {
    const res = await fetch(
      `${CMS_URL}/api/image-choice-assessments?where[isActive][equals]=true&limit=100&sort=-updatedAt`,
      { next: { revalidate: 0 } },
    )
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: text || res.statusText },
        { status: res.status },
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Assessments list fetch error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load assessments' },
      { status: 502 },
    )
  }
}
