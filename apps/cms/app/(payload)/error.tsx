'use client'

import { useEffect } from 'react'

export default function PayloadError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the full error in the console so you can see it in browser devtools
    console.error('Payload admin error:', error)
    console.error('Digest (for server logs):', error.digest)
  }, [error])

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '40rem' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        The admin failed to render. In production the exact error is hidden for security.
      </p>
      <ul style={{ marginBottom: '1rem', paddingLeft: '1.25rem' }}>
        <li>Check <strong>Vercel → Project → Logs</strong> (Runtime Logs) for the real error.</li>
        <li>Ensure <strong>DATABASE_URI</strong> and <strong>PAYLOAD_SECRET</strong> are set in Vercel Environment Variables.</li>
        <li>If you use image uploads (Media), <strong>sharp</strong> must be compatible with the serverless runtime.</li>
      </ul>
      <p style={{ fontSize: '0.875rem', color: '#888' }}>
        Digest: {error.digest ?? 'none'}
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        Try again
      </button>
    </div>
  )
}
