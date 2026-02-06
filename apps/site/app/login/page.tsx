'use client'

import { Login3 } from '@/components/login3'

export default function LoginPage() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    // TODO: Integrate with Payload /api/users/login or your auth provider
    console.log({ email, password })
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
      buttonText="Sign in"
      signupText="Need an account?"
      signupUrl="/signup"
      onSubmit={handleSubmit}
    />
  )
}
