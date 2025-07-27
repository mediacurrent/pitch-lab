'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from './ui/button'
import { Home } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <nav className="fixed top-4 right-4 z-50">
      <div className="flex gap-2">
        {/* Navigation buttons can be added here if needed */}
      </div>
    </nav>
  )
} 