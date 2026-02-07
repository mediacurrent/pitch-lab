import { NextResponse } from 'next/server'

const CMS_URL = process.env.CMS_URL || 'http://localhost:3001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const token = searchParams.get('token')
  if (!id || !token) {
    return NextResponse.json({ error: 'id and token required' }, { status: 400 })
  }
  const params = new URLSearchParams(searchParams)
  const res = await fetch(
    `${CMS_URL}/api/content-rank-result?${params.toString()}`,
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }
  return NextResponse.json(data)
}
