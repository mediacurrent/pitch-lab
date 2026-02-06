import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Image choice',
  description: 'Time-based selection between two images',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
