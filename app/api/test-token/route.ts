import { NextResponse } from 'next/server'

export async function GET() {
  const hasToken = !!process.env.SANITY_API_TOKEN
  const tokenLength = process.env.SANITY_API_TOKEN?.length || 0
  const tokenPrefix = process.env.SANITY_API_TOKEN?.substring(0, 3) || 'none'
  
  return NextResponse.json({
    hasToken,
    tokenLength,
    tokenPrefix,
    message: hasToken 
      ? '✅ SANITY_API_TOKEN is configured' 
      : '❌ SANITY_API_TOKEN is missing'
  })
}
