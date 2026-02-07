/**
 * Page Audit logic – from page-audit-app.
 * Parses Screaming Frog + GA4 CSVs, merges by path, categorizes into KEEP, KILL, MERGE.
 */

export type Category = 'KEEP' | 'KILL' | 'MERGE'

export interface CategorizeOptions {
  topTrafficPercent: number
  nearZeroViews: number
  thinContentWords: number
  fewInlinks: number
  lowEngagementSec: number
}

export const DEFAULT_OPTIONS: CategorizeOptions = {
  topTrafficPercent: 25,
  nearZeroViews: 10,
  thinContentWords: 300,
  fewInlinks: 2,
  lowEngagementSec: 5,
}

export interface RankedPage {
  id: string
  url: string
  path: string
  category: Category
  reasons: string[]
  wordCount: number
  inlinks: number
  outlinks: number
  views: number
  engagementTimeSec: number
  conversions: number
}

// --- CSV parsing (no Papa dependency) ---
type CsvRow = Record<string, string>

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const header = lines[0] ?? ''
  const delim = header.includes('\t') ? '\t' : ','
  const headers = parseRow(header, delim)
  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i] ?? '', delim)
    const row: CsvRow = {}
    headers.forEach((h, j) => {
      row[h] = values[j] ?? ''
    })
    rows.push(row)
  }
  return rows
}

function parseRow(line: string, delim: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (!inQuotes && c === delim) {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

function findColumn(row: Record<string, string>, ...names: string[]): string | undefined {
  const keys = Object.keys(row)
  const lower = (s: string) => s.toLowerCase().trim().replace(/^\uFEFF/, '')
  for (const name of names) {
    const n = lower(name)
    const found = keys.find((k) => lower(k) === n || lower(k).includes(n))
    if (found && row[found] !== undefined && row[found] !== '') return row[found]
  }
  return undefined
}

function getRowVal(row: CsvRow, key: string): string | undefined {
  if (row[key] !== undefined && row[key] !== '') return row[key]
  const trimmedKey = key.trim().replace(/^\uFEFF/, '')
  const found = Object.keys(row).find((k) => k.trim().replace(/^\uFEFF/, '') === trimmedKey)
  return found ? row[found] : undefined
}

function num(val: unknown): number {
  if (val === undefined || val === null || val === '') return 0
  if (typeof val === 'number' && !Number.isNaN(val)) return val
  const s = String(val).replace(/,/g, '').trim()
  const n = parseFloat(s)
  return Number.isNaN(n) ? 0 : n
}

function parseEngagementTime(val: unknown): number {
  if (val === undefined || val === null || val === '') return 0
  const s = String(val).trim()
  const n = parseFloat(s.replace(/,/g, ''))
  if (!Number.isNaN(n)) return n
  const match = s.match(/^(?:(\d+):)?(\d+):(\d+)$/)
  if (match) {
    const [, h, m, sec] = match.map(Number)
    return ((h ?? 0) * 3600 + (m ?? 0) * 60 + (sec ?? 0)) || 0
  }
  const matchMmSs = s.match(/^(\d+):(\d+)$/)
  if (matchMmSs) {
    const [, m, sec] = matchMmSs.map(Number)
    return ((m ?? 0) * 60 + (sec ?? 0)) || 0
  }
  return 0
}

function getPathFromUrl(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://example.com${url}`)
    return u.pathname.replace(/\/$/, '') || '/'
  } catch {
    return url
  }
}

function normalizeGA4Path(path: string): string {
  const pipe = path.indexOf(' | ')
  let base = pipe >= 0 ? path.slice(0, pipe).trim() : path.trim()
  if (base.startsWith('http://') || base.startsWith('https://')) {
    try {
      base = new URL(base).pathname
    } catch {
      // leave as-is
    }
  }
  // GA4 "Page path" may be path-only; "Page Location" is full URL (handled above).
  // Some exports have hostname before path: "example.com/blog/post" -> extract "/blog/post"
  if (!base.startsWith('/') && base.includes('/')) {
    const firstSlash = base.indexOf('/')
    const beforeSlash = base.slice(0, firstSlash)
    if (beforeSlash.includes('.')) {
      base = base.slice(firstSlash)
    }
  }
  const qIdx = base.indexOf('?')
  if (qIdx >= 0) base = base.slice(0, qIdx)
  if (!base.startsWith('/')) return '/' + base
  return base.replace(/\/$/, '') || '/'
}

function pathToKey(path: string): string {
  return (path.replace(/\/$/, '') || '/').toLowerCase()
}

// --- Screaming Frog parsing ---
interface ScreamingFrogRow {
  url: string
  path: string
  wordCount: number
  inlinks: number
  outlinks: number
}

function parseScreamingFrogCsv(csv: string): ScreamingFrogRow[] {
  const rows = parseCsv(csv)
  const result: ScreamingFrogRow[] = []
  for (const row of rows) {
    const url = (getRowVal(row, 'Address') ?? getRowVal(row, 'URL') ?? getRowVal(row, 'Uri') ?? '').trim()
    if (!url) continue
    const path = getPathFromUrl(url)
    result.push({
      url,
      path,
      wordCount: num(getRowVal(row, 'Word Count') ?? getRowVal(row, 'Word count') ?? getRowVal(row, 'Words')),
      inlinks: num(getRowVal(row, 'Inlinks') ?? getRowVal(row, 'In Links')),
      outlinks: num(getRowVal(row, 'Outlinks') ?? getRowVal(row, 'Out Links')),
    })
  }
  // Deduplicate by path: keep median
  const groups = new Map<string, ScreamingFrogRow[]>()
  for (const r of result) {
    const key = pathToKey(r.path)
    const list = groups.get(key) ?? []
    list.push(r)
    groups.set(key, list)
  }
  const out: ScreamingFrogRow[] = []
  for (const list of groups.values()) {
    const first = list[0]
    if (list.length === 1 && first) {
      out.push(first)
      continue
    }
    const sorted = [...list].sort((a, b) => a.wordCount - b.wordCount || a.inlinks - b.inlinks)
    const mid = sorted[Math.floor(sorted.length / 2)]
    if (mid) out.push(mid)
  }
  return out
}

// --- GA4 parsing ---
interface GA4Row {
  path: string
  views: number
  engagementTimeSec: number
  conversions: number
}

function parseGA4Csv(csv: string): GA4Row[] {
  const rows = parseCsv(csv)
  const result: GA4Row[] = []
  for (const row of rows) {
    const pathRaw = (
      getRowVal(row, 'Page path') ??
      getRowVal(row, 'Page path and screen class') ??
      getRowVal(row, 'Page Path') ??
      getRowVal(row, 'Page location') ??
      getRowVal(row, 'Page Location') ??
      ''
    ).trim()
    if (!pathRaw) continue
    const lower = pathRaw.toLowerCase()
    if (lower === '(not set)' || lower === 'total') continue
    const path = normalizeGA4Path(pathRaw)
    const engagementVal =
      getRowVal(row, 'Average engagement time per session') ??
      getRowVal(row, 'Average engagement time') ??
      getRowVal(row, 'Engagement time') ??
      0
    result.push({
      path,
      views: num(getRowVal(row, 'Views') ?? getRowVal(row, 'Views per user') ?? getRowVal(row, 'Screen views')),
      engagementTimeSec: parseEngagementTime(engagementVal),
      conversions: num(getRowVal(row, 'Conversions') ?? getRowVal(row, 'Conversions (total)')),
    })
  }
  return result
}

// --- Merge ---
function mergeData(
  sfRows: ScreamingFrogRow[],
  ga4Rows: GA4Row[],
): Array<Omit<RankedPage, 'id' | 'category' | 'reasons'>> {
  const ga4ByPath = new Map<string, GA4Row>()
  for (const row of ga4Rows) {
    const key = pathToKey(row.path)
    const existing = ga4ByPath.get(key)
    if (!existing || row.views > existing.views) ga4ByPath.set(key, row)
  }

  const merged: Array<Omit<RankedPage, 'id' | 'category' | 'reasons'>> = []
  for (const sf of sfRows) {
    const pathKey = pathToKey(sf.path)
    const ga4 = ga4ByPath.get(pathKey) ?? {
      path: pathKey,
      views: 0,
      engagementTimeSec: 0,
      conversions: 0,
    }
    merged.push({
      url: sf.url,
      path: sf.path,
      wordCount: sf.wordCount,
      inlinks: sf.inlinks,
      outlinks: sf.outlinks,
      views: ga4.views,
      engagementTimeSec: ga4.engagementTimeSec,
      conversions: ga4.conversions,
    })
  }
  return merged
}

// --- Categorize ---
function percentileThreshold(values: number[], p: number): number {
  const sorted = [...values].filter((v) => v > 0).sort((a, b) => a - b)
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)] ?? 0
}

function categorize(
  merged: Array<Omit<RankedPage, 'id' | 'category' | 'reasons'>>,
  options: CategorizeOptions = DEFAULT_OPTIONS,
): Omit<RankedPage, 'id'>[] {
  const views = merged.map((m) => m.views)
  const topTrafficThreshold = percentileThreshold(views, 100 - options.topTrafficPercent)

  const result: Omit<RankedPage, 'id'>[] = []
  for (const page of merged) {
    const reasons: string[] = []
    let category: Category = 'MERGE'

    const zeroTraffic = page.views < options.nearZeroViews
    const thinContent = page.wordCount > 0 && page.wordCount < options.thinContentWords
    const veryLowEngagement = page.views > 0 && page.engagementTimeSec < options.lowEngagementSec
    const fewInlinks = page.inlinks <= options.fewInlinks

    if (zeroTraffic) reasons.push(`Very low traffic (${page.views} views)`)
    if (thinContent) reasons.push(`Thin content (${page.wordCount} words)`)
    if (veryLowEngagement) reasons.push(`Low engagement (${page.engagementTimeSec.toFixed(0)}s)`)
    if (fewInlinks) reasons.push(`Few internal links (${page.inlinks})`)

    const killScore =
      (zeroTraffic ? 2 : 0) +
      (thinContent ? 1 : 0) +
      (veryLowEngagement ? 1 : 0) +
      (fewInlinks && page.views < options.nearZeroViews ? 1 : 0)

    if (killScore >= 2) {
      category = 'KILL'
      if (!reasons.length) reasons.push('Multiple low-quality signals')
    } else {
      const topTraffic = page.views >= topTrafficThreshold && topTrafficThreshold > 0
      const hasConversions = page.conversions > 0
      const strongInlinks = page.inlinks >= 10
      const decentContent = page.wordCount >= options.thinContentWords
      const decentEngagement = page.engagementTimeSec >= options.lowEngagementSec * 2

      if (topTraffic) reasons.push(`Top ${options.topTrafficPercent}% traffic (${page.views} views)`)
      if (hasConversions) reasons.push(`${page.conversions} conversions`)
      if (strongInlinks) reasons.push(`Strong inbound links (${page.inlinks})`)
      if (decentContent) reasons.push(`Solid content (${page.wordCount} words)`)
      if (decentEngagement) reasons.push(`Good engagement (${(page.engagementTimeSec / 60).toFixed(1)} min)`)

      const keepScore =
        (topTraffic ? 2 : 0) +
        (hasConversions ? 2 : 0) +
        (strongInlinks ? 1 : 0) +
        (decentContent ? 1 : 0) +
        (decentEngagement ? 1 : 0)

      if (keepScore >= 2) {
        category = 'KEEP'
      } else if (killScore === 0) {
        if (page.views > 0 && page.views < topTrafficThreshold && page.wordCount >= options.thinContentWords) {
          reasons.push('Moderate traffic, consider merging with similar pages')
        }
        if (reasons.length === 0) reasons.push('Review manually')
      }
    }

    result.push({
      ...page,
      category,
      reasons: reasons.length ? reasons : ['Review manually'],
    })
  }

  return result
}

// --- Public API ---
export function analyzeContent(
  screamingFrogCsv: string,
  ga4Csv: string,
  options: CategorizeOptions = DEFAULT_OPTIONS,
): RankedPage[] {
  const sfRows = parseScreamingFrogCsv(screamingFrogCsv)
  const ga4Rows = parseGA4Csv(ga4Csv)
  const merged = mergeData(sfRows, ga4Rows)
  const categorized = categorize(merged, options)
  return categorized.map((p, i) => ({ ...p, id: `page-${i + 1}` }))
}
