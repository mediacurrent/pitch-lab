import type { Metadata } from 'next'

const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL
  ? process.env.PAYLOAD_PUBLIC_SERVER_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3001'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'CMS Admin',
  description: 'Payload CMS Admin',
}

/**
 * Root layout for / (redirect). Payload admin uses (payload)/layout.tsx (RootLayout) as its root.
 * No app/layout.tsx so we avoid duplicate <html>/<body> and hydration errors.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
