import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Content rank',
  description: 'Rank site pages from ScreamingFrog + GA4: move, lost, or reuse',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
