import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('GET /api/sessions called');
  return NextResponse.json({ 
    message: 'Sessions API is working',
    env: {
      hasProjectId: !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      hasToken: !!process.env.SANITY_TOKEN,
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
      tokenLength: process.env.SANITY_TOKEN?.length || 0,
    },
    timestamp: new Date().toISOString(),
    status: 'healthy'
  })
}

export async function POST(request: NextRequest) {
  console.log('POST /api/sessions called');
  const token = process.env.SANITY_TOKEN || process.env.SANITY_API_TOKEN
  console.log('Environment check at start:', {
    hasProjectId: !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    hasToken: !!token,
    hasSanityToken: !!process.env.SANITY_TOKEN,
    hasSanityApiToken: !!process.env.SANITY_API_TOKEN,
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  });
  
  try {
    // Validate environment variables BEFORE creating client
    const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    if (!projectId) {
      console.error('Missing SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_PROJECT_ID')
      return NextResponse.json(
        { 
          error: 'Sanity project ID not configured',
          details: 'The SANITY_PROJECT_ID (preferred) or NEXT_PUBLIC_SANITY_PROJECT_ID environment variable is missing. Please add it to your Vercel environment variables.',
          env: {
            hasProjectId: false,
            hasSanityProjectId: !!process.env.SANITY_PROJECT_ID,
            hasNextPublicProjectId: !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
            hasToken: !!token,
            tokenLength: token?.length || 0,
          }
        },
        { status: 500 }
      )
    }

    const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
    
    if (!token) {
      console.error('Missing SANITY_TOKEN or SANITY_API_TOKEN')
      return NextResponse.json(
        { 
          error: 'Sanity token not configured',
          details: 'The SANITY_TOKEN or SANITY_API_TOKEN environment variable is missing. Please add it to your Vercel environment variables.',
          env: {
            hasProjectId: !!projectId,
            hasToken: false,
            hasSanityToken: !!process.env.SANITY_TOKEN,
            hasSanityApiToken: !!process.env.SANITY_API_TOKEN,
          }
        },
        { status: 500 }
      )
    }

    // Create a server-side Sanity client with write permissions
    let client;
    try {
      client = createClient({
        projectId,
        dataset,
        apiVersion: '2025-07-25',
        token,
        useCdn: false,
      });
      console.log('Sanity client created successfully');
    } catch (clientError) {
      console.error('Failed to create Sanity client:', clientError);
      return NextResponse.json(
        { 
          error: 'Failed to create Sanity client', 
          details: clientError instanceof Error ? clientError.message : 'Unknown error',
          config: {
            hasProjectId: !!projectId,
            hasDataset: !!dataset,
            hasToken: !!token,
            projectIdLength: projectId?.length || 0,
            tokenLength: token?.length || 0,
          }
        },
        { status: 500 }
      );
    }

    // Debug logging
    console.log('API Route: Environment variables check:')
    console.log('Project ID:', projectId)
    console.log('Dataset:', dataset)
    console.log('Token exists:', !!token)
    console.log('Token length:', token?.length)

    let sessionData;
    try {
      sessionData = await request.json()
      console.log('Session data received:', sessionData)
    } catch (parseError) {
      console.error('Failed to parse request JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

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
    
    // Test the connection first (optional - just for debugging)
    try {
      const testQuery = await client.fetch('*[_type == "votingSession"] | order(_createdAt desc)[0...1]');
      console.log('Sanity connection test successful, found', testQuery?.length || 0, 'existing sessions');
    } catch (testError) {
      console.error('Sanity connection test failed:', testError);
      // Don't fail here - the token might not have read permissions but might have write permissions
      // We'll try to create the document anyway
      console.warn('Warning: Connection test failed, but proceeding with document creation. Error:', testError instanceof Error ? testError.message : 'Unknown error');
    }
    
    // Attempt to create the document
    let result;
    try {
      result = await client.create(doc)
      console.log('Document created successfully:', result._id)
    } catch (createError) {
      console.error('Failed to create document in Sanity:', createError);
      const errorMessage = createError instanceof Error ? createError.message : 'Unknown error';
      const errorDetails = createError instanceof Error ? {
        name: createError.name,
        message: createError.message,
        ...(createError.stack && { stack: createError.stack })
      } : {};
      
      return NextResponse.json(
        { 
          error: 'Failed to create document in Sanity',
          details: errorMessage,
          ...(process.env.NODE_ENV === 'development' && errorDetails),
          config: {
            projectId: projectId?.substring(0, 8) + '...',
            dataset,
            hasToken: !!token,
            tokenLength: token?.length || 0,
          }
        },
        { status: 500 }
      );
    }

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
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json(
      { 
        error: 'Failed to save session', 
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
} 