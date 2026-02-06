import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fill in the blank',
  description: 'Complete text boxes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
