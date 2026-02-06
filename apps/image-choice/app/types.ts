/** Minimal types for assessment data from CMS API (image-choice-assessments). */

export interface MediaDoc {
  id: string
  url?: string | null
  alt?: string | null
}

export interface ImagePair {
  id?: string | null
  pairTitle?: string | null
  imageLeft: string | MediaDoc
  imageRight: string | MediaDoc
  question?: string | null
}

export interface ImageChoiceAssessment {
  id: string
  title: string
  description?: string | null
  imagePairs: ImagePair[]
  duration: number
  isActive?: boolean | null
  instructions?: { root?: { children?: unknown[] } } | null
}

export function getMediaUrl(media: string | MediaDoc): string | null {
  if (typeof media === 'string') return null
  return media?.url ?? null
}

function collectText(node: unknown): string[] {
  if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>
    if ('text' in n && typeof n.text === 'string') return [n.text]
    if ('children' in n && Array.isArray(n.children)) {
      return (n.children as unknown[]).flatMap(collectText)
    }
  }
  return []
}

export function instructionsToText(instructions: ImageChoiceAssessment['instructions']): string {
  if (!instructions?.root?.children || !Array.isArray(instructions.root.children)) return ''
  const parts = (instructions.root.children as unknown[]).flatMap(collectText)
  return parts.join(' ').trim()
}
