/**
 * Migration session API handlers. Used by both the Next.js route and payload.config endpoints.
 */
import type { Payload } from 'payload'
import { generateSessionId } from '../collections/MigrationReviewSession'

function checkAuth(): Response | null {
  const secret = process.env.MIGRATION_SESSION_API_SECRET
  if (!secret) return Response.json({ error: 'Migration session API not configured' }, { status: 503 })
  return null
}

export async function handleMigrationSessionGet(
  payload: Payload,
  request: Request
): Promise<Response> {
  const auth = checkAuth()
  if (auth) return auth
  const secret = process.env.MIGRATION_SESSION_API_SECRET!
  if (request.headers.get('x-migration-session-secret') !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const url = new URL(request.url || '', 'http://localhost')
    const sessionId = url.searchParams.get('sessionId')?.trim()
    const email = url.searchParams.get('email')?.trim()
    if (!sessionId && !email) {
      return Response.json({ error: 'sessionId or email required' }, { status: 400 })
    }
    if (sessionId) {
      const result = await payload.find({
        collection: 'migration-review-sessions',
        where: { sessionId: { equals: sessionId } },
        limit: 1,
        overrideAccess: true,
      })
      const doc = result.docs[0]
      if (!doc) return Response.json({ error: 'Session not found' }, { status: 404 })
      const d = doc as { email: string; sessionId: string; dataVersion?: string; decisions?: unknown }
      return Response.json({
        sessionId: d.sessionId,
        email: d.email,
        dataVersion: d.dataVersion ?? null,
        decisions: d.decisions ?? {},
      })
    }
    const result = await payload.find({
      collection: 'migration-review-sessions',
      where: { email: { equals: email! } },
      sort: '-updatedAt',
      limit: 1,
      overrideAccess: true,
    })
    const doc = result.docs[0]
    if (!doc) return Response.json({ error: 'Session not found' }, { status: 404 })
    const d = doc as { email: string; sessionId: string; dataVersion?: string; decisions?: unknown }
    return Response.json({
      sessionId: d.sessionId,
      email: d.email,
      dataVersion: d.dataVersion ?? null,
      decisions: d.decisions ?? {},
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[migration-session GET]', message)
    return Response.json(
      { error: 'Migration session fetch failed', details: message },
      { status: 500 }
    )
  }
}

export async function handleMigrationSessionPost(
  payload: Payload,
  request: Request
): Promise<Response> {
  const auth = checkAuth()
  if (auth) return auth
  const secret = process.env.MIGRATION_SESSION_API_SECRET!
  if (request.headers.get('x-migration-session-secret') !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    let body: { email?: string; sessionId?: string; dataVersion?: string; decisions?: Record<string, { client_decision: string; notes: string }> } | null = null
    try {
      body = await request.json()
    } catch {
      body = null
    }
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null
    if (!email) return Response.json({ error: 'email required' }, { status: 400 })
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() || null : null
    const dataVersion = typeof body.dataVersion === 'string' ? body.dataVersion.trim() || null : null
    const decisions = body.decisions && typeof body.decisions === 'object' ? body.decisions : null

    if (sessionId) {
      const existing = await payload.find({
        collection: 'migration-review-sessions',
        where: { sessionId: { equals: sessionId } },
        limit: 1,
        overrideAccess: true,
      })
      const doc = existing.docs[0]
      if (doc) {
        await payload.update({
          collection: 'migration-review-sessions',
          id: doc.id,
          data: {
            ...(dataVersion != null && { dataVersion }),
            ...(decisions != null && { decisions }),
          },
          draft: false,
          overrideAccess: true,
        })
        const d = doc as { sessionId: string; email: string }
        return Response.json({ sessionId: d.sessionId, email: d.email })
      }
    }

    const existingByEmail = await payload.find({
      collection: 'migration-review-sessions',
      where: { email: { equals: email } },
      sort: '-updatedAt',
      limit: 1,
      overrideAccess: true,
    })
    const existingDoc = existingByEmail.docs[0]
    if (existingDoc) {
      await payload.update({
        collection: 'migration-review-sessions',
        id: existingDoc.id,
        data: {
          ...(dataVersion != null && { dataVersion }),
          ...(decisions != null && { decisions }),
        },
        draft: false,
        overrideAccess: true,
      })
      const d = existingDoc as { sessionId: string; email: string }
      return Response.json({ sessionId: d.sessionId, email: d.email })
    }

    const created = await payload.create({
      collection: 'migration-review-sessions',
      data: {
        email,
        sessionId: generateSessionId(),
        dataVersion: dataVersion ?? undefined,
        decisions: decisions ?? undefined,
      },
      draft: false,
      overrideAccess: true,
    })
    const d = created as { sessionId: string; email: string }
    return Response.json({ sessionId: d.sessionId, email: d.email })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('[migration-session POST]', message, stack)
    return Response.json(
      { error: 'Migration session update failed', details: message },
      { status: 500 }
    )
  }
}
