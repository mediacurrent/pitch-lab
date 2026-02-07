import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: false,
  },
  // OG images must be same-origin to avoid CORS. Set PAYLOAD_PUBLIC_SERVER_URL to your canonical domain (e.g. https://pitch-lab-cms.vercel.app).
  metadataBase: process.env.PAYLOAD_PUBLIC_SERVER_URL
    ? new URL(process.env.PAYLOAD_PUBLIC_SERVER_URL)
    : new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001'),
}

export default withPayload(nextConfig)
