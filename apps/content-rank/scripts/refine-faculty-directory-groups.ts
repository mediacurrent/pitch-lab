/**
 * Refines Faculty Directory url_group in nysid_migration_analysis_v2.csv
 * into sub-types: author grouping, tag filter, filtered, date-based bio, bio.
 *
 * Run: npx tsx apps/content-rank/scripts/refine-faculty-directory-groups.ts
 * Or: pnpm exec tsx apps/content-rank/scripts/refine-faculty-directory-groups.ts
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { refineFacultyDirectoryUrlGroup } from '../lib/refineFacultyDirectoryUrlGroup'

const CSV_PATH = join(__dirname, '../lib/nysid_migration_analysis_v2.csv')

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

function serializeRow(row: string[]): string {
  return row.map(escapeCSV).join(',')
}

const URL_INDEX = 0
const URL_GROUP_INDEX = 4

function main() {
  const content = readFileSync(CSV_PATH, 'utf-8')
  const lines = content.split(/\r?\n/)
  const header = lines[0]
  const dataLines = lines.slice(1)

  let updated = 0
  const output: string[] = [header]

  for (const line of dataLines) {
    if (!line.trim()) {
      output.push(line)
      continue
    }
    const row = parseCSVLine(line)
    const url = row[URL_INDEX] ?? ''
    const baseUrlGroup = row[URL_GROUP_INDEX] ?? ''
    const refined = refineFacultyDirectoryUrlGroup(url, baseUrlGroup)
    if (refined !== baseUrlGroup) {
      row[URL_GROUP_INDEX] = refined
      updated++
    }
    output.push(serializeRow(row))
  }

  writeFileSync(CSV_PATH, output.join('\n') + '\n', 'utf-8')
  console.log(`Updated ${updated} rows with refined Faculty Directory url_group`)
}

main()
