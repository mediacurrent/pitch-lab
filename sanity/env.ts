export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-07-25'

export const dataset = 'production'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'z4rfh7pa'

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}
