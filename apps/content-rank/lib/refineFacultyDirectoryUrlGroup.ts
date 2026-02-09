/**
 * Refines url_group for Faculty Directory pages into distinct sub-types for review.
 *
 * - Faculty Directory (author grouping): ?author=... — grouping pages, may not need in new site
 * - Faculty Directory (tag filter): /faculty-directory/tag/r — filtered directory pages (A–Z)
 * - Faculty Directory (filtered): ?offset=... or ?tag=... — paginated/filtered views
 * - Faculty Directory (date-based bio): /faculty-directory/2017/10/18/shaun-fillion — review, standardize URLs
 * - Faculty Directory (bio): /faculty-directory/richard-todd-class — regular faculty bio pages
 */
export type FacultyDirectorySubType =
  | 'Faculty Directory (author grouping)'
  | 'Faculty Directory (tag filter)'
  | 'Faculty Directory (filtered)'
  | 'Faculty Directory (date-based bio)'
  | 'Faculty Directory (bio)'

/**
 * Returns a refined url_group for Faculty Directory URLs. For non–faculty-directory
 * base groups, returns the original value unchanged.
 */
export function refineFacultyDirectoryUrlGroup(
  url: string,
  baseUrlGroup: string
): string {
  if (baseUrlGroup !== 'Faculty Directory') return baseUrlGroup

  const urlLower = (url || '').toLowerCase()
  if (!urlLower.includes('faculty-directory')) return baseUrlGroup

  try {
    const parsed = new URL(url, 'https://example.edu')
    const path = parsed.pathname
    const search = parsed.searchParams

    // 1. ?author= — author grouping pages (may not need in new site)
    if (search.has('author')) {
      return 'Faculty Directory (author grouping)'
    }

    // 2. /faculty-directory/tag/x — filtered directory by letter (e.g. /tag/r, /tag/s)
    if (/\/faculty-directory\/tag\//i.test(path)) {
      return 'Faculty Directory (tag filter)'
    }

    // 3. ?offset= or ?tag= — paginated/filtered views
    if (search.has('offset') || search.has('tag')) {
      return 'Faculty Directory (filtered)'
    }

    // 4. /faculty-directory/YYYY/MM/DD/slug — date-based bio (standardize URLs)
    if (/\/faculty-directory\/\d{4}\/\d{1,2}\/\d{1,2}\//i.test(path)) {
      return 'Faculty Directory (date-based bio)'
    }

    // 5. /faculty-directory/slug — regular faculty bio
    if (/\/faculty-directory\/[^/]+/i.test(path)) {
      return 'Faculty Directory (bio)'
    }

    // Base path only (e.g. /faculty-directory)
    return baseUrlGroup
  } catch {
    return baseUrlGroup
  }
}

/** Display labels for review UI badges. */
export const FACULTY_DIRECTORY_BADGE_LABELS: Record<FacultyDirectorySubType, string> = {
  'Faculty Directory (author grouping)':
    'Faculty Directory — Author grouping (assess if needed in new site)',
  'Faculty Directory (tag filter)': 'Faculty Directory — Filtered (A–Z)',
  'Faculty Directory (filtered)': 'Faculty Directory — Filtered/paginated',
  'Faculty Directory (date-based bio)': 'Faculty Directory — Date-based bio (standardize URLs)',
  'Faculty Directory (bio)': 'Faculty Directory — Faculty bio',
}
