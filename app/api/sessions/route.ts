import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export async function POST(request: NextRequest) {
  try {
    // Create a server-side Sanity client with write permissions
    const client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      apiVersion: '2025-07-25',
      token: process.env.SANITY_TOKEN, // This needs to be a token with write permissions
      useCdn: false,
    })

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      return NextResponse.json(
        { error: 'Sanity project ID not configured' },
        { status: 500 }
      )
    }

    // Debug logging
    console.log('API Route: Environment variables check:')
    console.log('Project ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
    console.log('Dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET)
    console.log('Token exists:', !!process.env.SANITY_TOKEN)
    console.log('Token length:', process.env.SANITY_TOKEN?.length)

    const sessionData = await request.json()
    console.log('Session data received:', sessionData)

    // Validate required fields
    if (!sessionData.userName || !sessionData.instanceId || !sessionData.instanceTitle) {
      console.log('Missing required fields:', { 
        userName: !!sessionData.userName, 
        instanceId: !!sessionData.instanceId, 
        instanceTitle: !!sessionData.instanceTitle 
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the document in Sanity
    const doc = {
      _type: 'votingSession',
      userName: sessionData.userName,
      instanceId: sessionData.instanceId,
      instanceTitle: sessionData.instanceTitle,
      sessionDate: new Date().toISOString(),
      votes: sessionData.votes.map((vote: any, index: number) => ({
        _key: `vote_${index}_${Date.now()}`,
        ...vote
      })),
      summary: sessionData.summary,
    }

    console.log('Attempting to create document in Sanity...')
    const result = await client.create(doc)
    console.log('Document created successfully:', result._id)

    return NextResponse.json({ 
      success: true, 
      sessionId: result._id 
    })

  } catch (error) {
    console.error('Error saving voting session:', error)
    return NextResponse.json(
      { error: 'Failed to save session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 