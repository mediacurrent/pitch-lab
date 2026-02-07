'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Login3 } from '@/components/login3'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Login failed')
      setLoading(false)
    }
  }

  return (
    <Login3
      heading="Login"
      logo={{
        url: '/',
        src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblocks-logo.svg',
        alt: 'Logo',
        title: 'Home',
      }}
      buttonText={loading ? 'Signing in...' : 'Sign in'}
      error={error}
      disabled={loading}
      signupText="Need an account?"
      signupUrl="/signup"
      onSubmit={handleSubmit}
    />
  )
}
