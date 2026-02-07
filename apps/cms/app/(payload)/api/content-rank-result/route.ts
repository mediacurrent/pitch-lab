import { NextRequest } from 'next/server'
import { handleContentRankResult } from '../../../../lib/content-rank-result'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const token = searchParams.get('token')
  if (!id || !token) {
    return Response.json({ error: 'id and token required' }, { status: 400 })
  }
  return handleContentRankResult(id, token, searchParams)
}
