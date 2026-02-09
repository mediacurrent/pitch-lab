import { extractYearsFromUrl } from './parseMigrationCSV'
import type { MigrationRow, MigrationRecommendation } from './parseMigrationCSV'

const GROUP_SEP = '\u001f'

export const QUERY_STRING_GROUP = 'Query string URLs'
export const TAG_GROUP = 'Tag URLs'
export const ACADEMIC_CALENDAR_LIST_GROUP = 'Academic calendar list'
export const CATEGORY_GROUP = 'Category URLs'

export const SHOW_MORE_CATEGORIES = [
  { urlGroup: QUERY_STRING_GROUP, label: 'Query string' },
  { urlGroup: TAG_GROUP, label: 'Tag' },
  { urlGroup: ACADEMIC_CALENDAR_LIST_GROUP, label: 'Academic calendar list' },
  { urlGroup: CATEGORY_GROUP, label: 'Category' },
] as const

export const SPECIAL_LEAVE_BEHIND_URL_GROUPS: Set<string> = new Set(
  SHOW_MORE_CATEGORIES.map((c) => c.urlGroup)
)

export interface ReviewGroup {
  recommendation: MigrationRecommendation
  reason: string
  url_group: string
  count: number
  pages: MigrationRow[]
  strategic_score: string
}

export function groupRows(rows: MigrationRow[]): ReviewGroup[] {
  const withQuery: MigrationRow[] = []
  const withTag: MigrationRow[] = []
  const withAcademicCalendar: MigrationRow[] = []
  const withCategory: MigrationRow[] = []
  const rest: MigrationRow[] = []
  for (const row of rows) {
    if (row.URL.includes('?')) {
      withQuery.push(row)
    } else if (row.URL.includes('/tag/')) {
      withTag.push(row)
    } else if (row.URL.includes('/academic-calendar-list/')) {
      withAcademicCalendar.push(row)
    } else if (row.URL.includes('/category/')) {
      withCategory.push(row)
    } else {
      rest.push(row)
    }
  }

  const map = new Map<string, MigrationRow[]>()
  for (const row of rest) {
    const key = [row.recommendation, row.reason, row.url_group].join(GROUP_SEP)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(row)
  }

  const groups: ReviewGroup[] = Array.from(map.entries())
    .filter(([, pages]) => pages.length > 0)
    .map(([, pages]) => {
      const first = pages[0]!
      return {
        recommendation: first.recommendation,
        reason: first.reason,
        url_group: first.url_group,
        count: pages.length,
        pages,
        strategic_score: first.strategic_score || first.strategic_value || '',
      }
    })

  const pushSpecial = (list: MigrationRow[], reason: string, urlGroup: string) => {
    if (list.length === 0) return
    const first = list[0]!
    groups.push({
      recommendation: 'LEAVE BEHIND',
      reason,
      url_group: urlGroup,
      count: list.length,
      pages: list,
      strategic_score: first.strategic_score || first.strategic_value || '',
    })
  }
  pushSpecial(withQuery, 'URL has query parameters', QUERY_STRING_GROUP)
  pushSpecial(withTag, 'URL includes /tag/', TAG_GROUP)
  pushSpecial(withAcademicCalendar, 'URL includes /academic-calendar-list/', ACADEMIC_CALENDAR_LIST_GROUP)
  pushSpecial(withCategory, 'URL includes /category/', CATEGORY_GROUP)

  return groups.sort((a, b) => b.count - a.count)
}

export function groupKey(g: ReviewGroup): string {
  return [g.recommendation, g.reason, g.url_group].join(GROUP_SEP)
}

export function groupYears(g: ReviewGroup): number[] {
  const set = new Set<number>()
  for (const row of g.pages) {
    for (const y of extractYearsFromUrl(row.URL)) set.add(y)
  }
  return Array.from(set).sort((a, b) => a - b)
}
