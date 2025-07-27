import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export async function GET() {
  return NextResponse.json({ 
    message: 'Sessions API is working',
    env: {
      hasProjectId: !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      hasToken: !!process.env.SANITY_TOKEN,
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
      tokenLength: process.env.SANITY_TOKEN?.length || 0,
    },
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    // Create a server-side Sanity client with write permissions
    let client;
    try {
      client = createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
        apiVersion: '2025-07-25',
        token: process.env.SANITY_TOKEN,
        useCdn: false,
      });
      console.log('Sanity client created successfully');
    } catch (clientError) {
      console.error('Failed to create Sanity client:', clientError);
      return NextResponse.json(
        { error: 'Failed to create Sanity client', details: clientError instanceof Error ? clientError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
      return NextResponse.json(
        { error: 'Sanity project ID not configured' },
        { status: 500 }
      )
    }

    if (!process.env.SANITY_TOKEN) {
      console.error('Missing SANITY_TOKEN')
      return NextResponse.json(
        { error: 'Sanity token not configured' },
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
    console.log('Document to create:', JSON.stringify(doc, null, 2))
    
    // Test the connection first
    try {
      const testQuery = await client.fetch('*[_type == "votingSession"] | order(_createdAt desc)[0...1]');
      console.log('Sanity connection test successful, found', testQuery?.length || 0, 'existing sessions');
    } catch (testError) {
      console.error('Sanity connection test failed:', testError);
      return NextResponse.json(
        { error: 'Sanity connection failed', details: testError instanceof Error ? testError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    const result = await client.create(doc)
    console.log('Document created successfully:', result._id)

    return NextResponse.json({ 
      success: true, 
      sessionId: result._id 
    })

  } catch (error) {
    console.error('Error saving voting session:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { error: 'Failed to save session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 