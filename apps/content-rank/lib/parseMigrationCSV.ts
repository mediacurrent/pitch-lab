import Papa from 'papaparse'

export type MigrationRecommendation =
  | 'MIGRATE'
  | 'ADAPT'
  | 'LEAVE BEHIND'
  | 'FLAG FOR REVIEW'
  | 'STALE CONTENT'

export interface MigrationRow {
  URL: string
  Original_URL: string
  'Title 1': string
  page_type: string
  url_group: string
  Views: string
  'Active users': string
  'Average engagement time per session': string
  strategic_value: string
  strategic_score: string
  recommendation: MigrationRecommendation
  reason: string
  flag_for_review: string
  is_stale: string
  quality_issues: string
  'Status Code': string
  Indexability: string
}

/** Year before which URLs are considered STALE CONTENT. */
const STALE_YEAR_CUTOFF = 2025

/** Regex: 4-digit year 19xx/20xx not part of a longer number (handles /2020/, -2020, .2020, etc.). */
const YEAR_IN_URL = /(?<!\d)(19|20)\d{2}(?!\d)/g

/** True if the URL contains a date (path or query) that is before 2025. */
function urlHasOldDate(url: string): boolean {
  if (!url || url.length < 4) return false
  const yearMatches = url.match(YEAR_IN_URL)
  if (!yearMatches) return false
  for (const y of yearMatches) {
    const year = parseInt(y, 10)
    if (year >= 1900 && year <= 2100 && year < STALE_YEAR_CUTOFF) return true
  }
  return false
}

/** Extract all years found in a URL (path or query). */
export function extractYearsFromUrl(url: string): number[] {
  if (!url || url.length < 4) return []
  const yearMatches = url.match(YEAR_IN_URL)
  if (!yearMatches) return []
  const years = [...new Set(yearMatches.map((y) => parseInt(y, 10)))]
  return years.filter((y) => y >= 1900 && y <= 2100).sort((a, b) => a - b)
}

function normalizeRecommendation(value: string): MigrationRecommendation {
  const v = String(value ?? '').trim().toUpperCase().replace(/\s+/g, ' ')
  if (
    v === 'MIGRATE' ||
    v === 'ADAPT' ||
    v === 'LEAVE BEHIND' ||
    v === 'FLAG FOR REVIEW' ||
    v === 'STALE CONTENT'
  ) {
    return v as MigrationRecommendation
  }
  return 'FLAG FOR REVIEW'
}

export function parseMigrationCSV(csv: string): MigrationRow[] {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  })
  const rows: MigrationRow[] = []
  for (const row of parsed.data) {
    if (!row?.URL) continue
    const url = String(row.URL ?? '').trim()
    let recommendation = normalizeRecommendation(row.recommendation ?? '')
    let reason = String(row.reason ?? '').trim() || '(no reason)'
    if (urlHasOldDate(url)) {
      recommendation = 'STALE CONTENT'
      reason =
        reason && reason !== '(no reason)'
          ? reason + '; URL has year before 2025'
          : 'URL has year before 2025'
    }
    rows.push({
      URL: url,
      Original_URL: String(row.Original_URL ?? row.URL ?? '').trim(),
      'Title 1': String(row['Title 1'] ?? '').trim(),
      page_type: String(row.page_type ?? '').trim(),
      url_group: String(row.url_group ?? '').trim() || '(ungrouped)',
      Views: String(row.Views ?? '').trim(),
      'Active users': String(row['Active users'] ?? '').trim(),
      'Average engagement time per session': String(
        row['Average engagement time per session'] ?? ''
      ).trim(),
      strategic_value: String(row.strategic_value ?? '').trim(),
      strategic_score: String(row.strategic_score ?? '').trim(),
      recommendation,
      reason,
      flag_for_review: String(row.flag_for_review ?? '').trim(),
      is_stale: String(row.is_stale ?? '').trim(),
      quality_issues: String(row.quality_issues ?? '').trim(),
      'Status Code': String(row['Status Code'] ?? '').trim(),
      Indexability: String(row.Indexability ?? '').trim(),
    })
  }
  return rows
}

export function formatEngagement(seconds: string): string {
  const n = parseFloat(seconds)
  if (!Number.isFinite(n)) return ''
  const s = Math.ceil(n)
  if (s >= 60) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }
  return `${s}s`
}

export function pathAfterEdu(url: string): string {
  const i = url.indexOf('.edu')
  if (i === -1) return url
  const slash = url.indexOf('/', i)
  return slash === -1 ? url : url.slice(slash)
}
