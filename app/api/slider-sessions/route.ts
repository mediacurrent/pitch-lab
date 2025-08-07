import { NextRequest, NextResponse } from 'next/server'
import { saveSliderSession } from '@/lib/sanity'

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json()
    
    const result = await saveSliderSession(sessionData)
    
    if (result) {
      return NextResponse.json({ success: true, sessionId: result })
    } else {
      return NextResponse.json(
        { error: 'Failed to save session' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in slider-sessions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
