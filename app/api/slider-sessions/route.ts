import { NextRequest, NextResponse } from 'next/server'
import { writeClient } from '@/lib/sanity'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json()
    
    console.log('🔍 API: writeClient exists:', !!writeClient)
    console.log('🔍 API: SANITY_API_TOKEN exists:', !!process.env.SANITY_API_TOKEN)
    console.log('🔍 API: Token length:', process.env.SANITY_API_TOKEN?.length || 0)
    
    if (!writeClient) {
      console.error('❌ API: Sanity write client not configured')
      return NextResponse.json(
        { error: 'Sanity write client not configured' },
        { status: 500 }
      )
    }
    
    const doc = {
      _type: 'sliderSession',
      sessionId: sessionData.sessionId,
      sliderInstance: {
        _type: 'reference',
        _ref: sessionData.sliderId,
      },
      startTime: new Date().toISOString(),
      status: 'completed',
      votes: sessionData.votes.map((vote: any) => ({
        pairTitle: vote.pairTitle,
        leftSide: vote.leftSide,
        rightSide: vote.rightSide,
        selectedSide: vote.selectedSide,
        timestamp: new Date().toISOString(),
        timeSpent: vote.timeSpent,
      })),
      metadata: {
        totalPairs: sessionData.votes.length,
        completedPairs: sessionData.votes.length,
      },
    }

    console.log('🔍 API: Attempting to create document')
    const result = await writeClient.create(doc)
    console.log('✅ API: Document created successfully:', result._id)
    
    return NextResponse.json({ success: true, sessionId: result._id })
  } catch (error) {
    console.error('❌ Error in slider-sessions API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
