/**
 * Regenerates nysid_review_groups_v2.csv from nysid_migration_analysis_v2.csv.
 * Groups by (recommendation, reason, url_group), sorted by page_count DESC.
 *
 * Run: pnpm dlx tsx apps/content-rank/scripts/regenerate-review-groups.ts
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const MIGRATION_PATH = join(__dirname, '../lib/nysid_migration_analysis_v2.csv')
const REVIEW_GROUPS_PATH = join(__dirname, '../lib/nysid_review_groups_v2.csv')

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += c
    }
  }
  result.push(current)
  return result
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const HEADERS = [
  'URL',
  'Original_URL',
  'Title 1',
  'page_type',
  'url_group',
  'Views',
  'Active users',
  'Average engagement time per session',
  'strategic_value',
  'strategic_score',
  'recommendation',
  'reason',
  'flag_for_review',
  'is_stale',
  'quality_issues',
  'Status Code',
  'Indexability',
]

function main() {
  const content = readFileSync(MIGRATION_PATH, 'utf-8')
  const lines = content.split(/\r?\n/)
  const dataLines = lines.slice(1).filter((l) => l.trim())

  const headerRow = parseCSVLine(lines[0])
  const urlIdx = headerRow.indexOf('URL')
  const urlGroupIdx = headerRow.indexOf('url_group')
  const recIdx = headerRow.indexOf('recommendation')
  const reasonIdx = headerRow.indexOf('reason')

  const groups = new Map<string, string[]>()
  for (const line of dataLines) {
    const row = parseCSVLine(line)
    const url = row[urlIdx] ?? ''
    const urlGroup = (row[urlGroupIdx] ?? '').trim() || '(ungrouped)'
    const rec = (row[recIdx] ?? '').trim() || '(unknown)'
    const reason = (row[reasonIdx] ?? '').trim() || '(no reason)'
    const key = [rec, reason, urlGroup].join('\x1f')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(url)
  }

  const sorted = Array.from(groups.entries())
    .map(([key, urls]) => {
      const [recommendation, reason, url_group] = key.split('\x1f')
      const samples = urls.slice(0, 5)
      return { recommendation, reason, url_group, count: urls.length, samples }
    })
    .sort((a, b) => b.count - a.count)

  const outRows: string[][] = [
    [
      'group_id',
      'recommendation',
      'url_group',
      'reason',
      'page_count',
      'sample_url_1',
      'sample_url_2',
      'sample_url_3',
      'sample_url_4',
      'sample_url_5',
    ],
  ]
  sorted.forEach((g, i) => {
    outRows.push([
      String(i + 1),
      g.recommendation,
      g.url_group,
      g.reason,
      String(g.count),
      g.samples[0] ?? '',
      g.samples[1] ?? '',
      g.samples[2] ?? '',
      g.samples[3] ?? '',
      g.samples[4] ?? '',
    ])
  })

  const csv = outRows.map((row) => row.map(escapeCSV).join(',')).join('\n') + '\n'
  writeFileSync(REVIEW_GROUPS_PATH, csv, 'utf-8')
  console.log(`Regenerated ${sorted.length} review groups`)
}

main()
