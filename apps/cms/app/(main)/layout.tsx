import type { Metadata } from 'next'

export const metadata: Metadata = {
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
