'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader } from '@repo/ui'
import {
  parseMigrationCSV,
  pathAfterEdu,
  formatEngagement,
  extractYearsFromUrl,
  type MigrationRow,
  type MigrationRecommendation,
} from '../../../lib/parseMigrationCSV'

const REC_COLORS: Record<MigrationRecommendation, string> = {
  MIGRATE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ADAPT: 'bg-amber-100 text-amber-800 border-amber-200',
  'LEAVE BEHIND': 'bg-rose-100 text-rose-800 border-rose-200',
  'FLAG FOR REVIEW': 'bg-blue-100 text-blue-800 border-blue-200',
  'STALE CONTENT': 'bg-zinc-100 text-zinc-800 border-zinc-300',
}

const REC_LABELS: Record<MigrationRecommendation, string> = {
  MIGRATE: 'Migrate',
  ADAPT: 'Adapt',
  'LEAVE BEHIND': 'Leave behind',
  'FLAG FOR REVIEW': 'Flag for review',
  'STALE CONTENT': 'Stale content',
}

const REC_OPTIONS: MigrationRecommendation[] = [
  'MIGRATE',
  'ADAPT',
  'FLAG FOR REVIEW',
  'LEAVE BEHIND',
  'STALE CONTENT',
]

/** Stored decision: always a recommendation. Legacy stale-specific values are normalized when loaded. */
type ClientDecision = MigrationRecommendation

type RecFilter = 'all' | MigrationRecommendation

interface ReviewGroup {
  recommendation: MigrationRecommendation
  reason: string
  url_group: string
  count: number
  pages: MigrationRow[]
  strategic_score: string
}

const GROUP_SEP = '\u001f'

function groupRows(rows: MigrationRow[]): ReviewGroup[] {
  const map = new Map<string, MigrationRow[]>()
  for (const row of rows) {
    const key = [row.recommendation, row.reason, row.url_group].join(GROUP_SEP)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(row)
  }
  return Array.from(map.entries())
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
    .sort((a, b) => b.count - a.count)
}

const STORAGE_KEY = 'nysid-review-decisions'
const VERSION_STORAGE_KEY = 'migration-data-version'

function loadDecisions(): Record<string, { client_decision: ClientDecision; notes: string }> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function groupKey(g: ReviewGroup): string {
  return [g.recommendation, g.reason, g.url_group].join(GROUP_SEP)
}

/** All years found in any URL in the group. */
function groupYears(g: ReviewGroup): number[] {
  const set = new Set<number>()
  for (const row of g.pages) {
    for (const y of extractYearsFromUrl(row.URL)) set.add(y)
  }
  return Array.from(set).sort((a, b) => a - b)
}

export default function GroupReviewPage() {
  const [data, setData] = useState<MigrationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [decisions, setDecisions] = useState<
    Record<string, { client_decision: ClientDecision; notes: string }>
  >({})
  const [clientDecision, setClientDecision] = useState<ClientDecision | null>(null)
  const [notes, setNotes] = useState('')
  const [recFilter, setRecFilter] = useState<RecFilter>('MIGRATE')
  const [urlsExpanded, setUrlsExpanded] = useState(false)
  /** When on STALE CONTENT, filter groups by single year (e.g. 2020). */
  const [staleYearFilter, setStaleYearFilter] = useState<'all' | number>('all')

  const loadCSV = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const version =
        typeof window !== 'undefined' ? localStorage.getItem(VERSION_STORAGE_KEY) : null
      const url = version
        ? `/api/migration-data?version=${encodeURIComponent(version)}`
        : '/api/migration-data'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load')
      const csv = await res.text()
      setData(parseMigrationCSV(csv))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCSV()
    setDecisions(loadDecisions())
  }, [loadCSV])

  const groups = useMemo(() => groupRows(data), [data])
  const filteredGroups = useMemo(() => {
    let list = recFilter === 'all' ? groups : groups.filter((g) => g.recommendation === recFilter)
    if (recFilter === 'STALE CONTENT' && staleYearFilter !== 'all') {
      const year = Number(staleYearFilter)
      list = list.filter((g) => groupYears(g).includes(year))
    }
    return list
  }, [groups, recFilter, staleYearFilter])

  const staleGroups = useMemo(
    () => groups.filter((g) => g.recommendation === 'STALE CONTENT'),
    [groups]
  )

  /** All years present in any stale group (for View by year single-year filter). */
  const staleYearOptions = useMemo(() => {
    const years = new Set<number>()
    for (const g of staleGroups) {
      for (const y of groupYears(g)) {
        if (y > 1945) years.add(y)
      }
    }
    return Array.from(years).sort((a, b) => a - b)
  }, [staleGroups])

  useEffect(() => {
    setCurrentIndex(0)
  }, [recFilter, staleYearFilter])

  const currentGroup = filteredGroups[currentIndex] ?? null

  useEffect(() => {
    setUrlsExpanded(false)
  }, [currentIndex, currentGroup])
  const saved = currentGroup ? decisions[groupKey(currentGroup)] : undefined

  const recCounts = useMemo(() => {
    const c: Record<RecFilter, number> = {
      all: groups.length,
      MIGRATE: 0,
      ADAPT: 0,
      'FLAG FOR REVIEW': 0,
      'LEAVE BEHIND': 0,
      'STALE CONTENT': 0,
    }
    for (const g of groups) {
      const rec = g.recommendation
      if (rec in c) c[rec] = (c[rec] ?? 0) + 1
    }
    return c
  }, [groups])

  /** Number of groups with a saved decision per category. */
  const decidedCounts = useMemo(() => {
    const c: Record<MigrationRecommendation, number> = {
      MIGRATE: 0,
      ADAPT: 0,
      'FLAG FOR REVIEW': 0,
      'LEAVE BEHIND': 0,
      'STALE CONTENT': 0,
    }
    for (const g of groups) {
      if (groupKey(g) in decisions) {
        const rec = g.recommendation
        if (rec in c) c[rec] = (c[rec] ?? 0) + 1
      }
    }
    return c
  }, [groups, decisions])

  useEffect(() => {
    if (saved) {
      const raw = saved.client_decision as string
      setClientDecision(REC_OPTIONS.includes(raw as MigrationRecommendation) ? raw as MigrationRecommendation : currentGroup.recommendation)
      setNotes(saved.notes)
    } else if (currentGroup) {
      setClientDecision(null)
      setNotes('')
    }
  }, [currentGroup, saved])

  const goNext = useCallback(() => {
    if (currentIndex < filteredGroups.length - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }, [currentIndex, filteredGroups.length])

  const saveDecision = useCallback(() => {
    if (!currentGroup) return
    const rec = clientDecision ?? currentGroup.recommendation
    const key = groupKey(currentGroup)
    setDecisions((prev) => {
      const next = { ...prev, [key]: { client_decision: rec, notes } }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (e) {
        console.warn('Failed to persist decision to localStorage', e)
      }
      return next
    })
    goNext()
  }, [currentGroup, clientDecision, notes, goNext])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    )
  }

  if (error || groups.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-slate-600">{error || 'No groups to review.'}</p>
            <Link href="/migration">
              <Button variant="outline" size="sm" className="mt-4">
                Back to Migration
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (filteredGroups.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <header className="mb-6">
            <Link href="/migration" className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">
              ← Migration Analyzer
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Group review</h1>
          </header>
          <p className="text-slate-600 mb-4">
            No groups for this recommendation. Choose another filter below.
          </p>
          <div className="flex flex-wrap gap-2">
            {REC_OPTIONS.map((rec) => (
              <Button
                key={rec}
                variant={recFilter === rec ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecFilter(rec)}
              >
                {REC_LABELS[rec]} ({recCounts[rec]})
              </Button>
            ))}
          </div>
          <Link href="/migration">
            <Button variant="outline" size="sm" className="mt-6">
              Back to Migration
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!currentGroup) {
    return null
  }

  /** When View by year is set (Stale content), only pages whose URL contains that year. */
  const pagesInYear =
    recFilter === 'STALE CONTENT' && staleYearFilter !== 'all'
      ? currentGroup.pages.filter((row) =>
          extractYearsFromUrl(row.URL).includes(Number(staleYearFilter))
        )
      : currentGroup.pages

  const displayedUrls = urlsExpanded ? pagesInYear : pagesInYear.slice(0, 5)
  const isYearFilterActive = recFilter === 'STALE CONTENT' && staleYearFilter !== 'all'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6">
          <Link
            href="/migration"
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block"
          >
            ← Migration Analyzer
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Group review</h1>
          <p className="text-slate-600 mt-2">
            Group {currentIndex + 1} of {filteredGroups.length}
            {recFilter !== 'all' ? ` (${REC_LABELS[recFilter]} only)` : ''} · {Object.keys(decisions).length} saved
          </p>
        </header>

        <>
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Review by recommendation</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-5">
                {REC_OPTIONS.map((rec) => {
                  const total = recCounts[rec]
                  const done = decidedCounts[rec]
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0
                  return (
                    <div key={rec} className="min-w-0 flex flex-col gap-1.5">
                      <Button
                        variant={recFilter === rec ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRecFilter(rec)}
                        className="w-full justify-center"
                      >
                        {REC_LABELS[rec]}
                      </Button>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span className="font-medium truncate">{REC_LABELS[rec]}</span>
                        <span className="tabular-nums shrink-0">{done}/{total}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-[width] duration-200 ${
                            rec === 'MIGRATE' ? 'bg-emerald-500' :
                            rec === 'ADAPT' ? 'bg-amber-500' :
                            rec === 'FLAG FOR REVIEW' ? 'bg-blue-500' :
                            rec === 'LEAVE BEHIND' ? 'bg-rose-500' :
                            'bg-zinc-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {recFilter === 'STALE CONTENT' && staleGroups.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-600">View by year</span>
                  <select
                    value={staleYearFilter === 'all' ? 'all' : String(staleYearFilter)}
                    onChange={(e) => {
                      const v = e.target.value
                      setStaleYearFilter(v === 'all' ? 'all' : parseInt(v, 10))
                    }}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800"
                  >
                    <option value="all">All years</option>
                    {staleYearOptions.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <Card>
          <CardHeader className="pb-2">
            <span className="inline-block w-fit rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-medium text-slate-700">
              {currentGroup.url_group}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>
                {isYearFilterActive
                  ? `${pagesInYear.length} of ${currentGroup.count} pages (${staleYearFilter} only)`
                  : `${currentGroup.count} pages`}
              </strong>{' '}
              recommended to{' '}
              <span
                className={`inline-block rounded border px-1.5 py-0.5 text-sm font-medium ${REC_COLORS[currentGroup.recommendation]}`}
              >
                {REC_LABELS[currentGroup.recommendation]}
              </span>
            </p>
            <p className="text-sm text-slate-600">
              Rationale: <em>{currentGroup.reason}</em>
            </p>
            {currentGroup.strategic_score && (
              <p className="text-sm text-slate-600">
                Strategic score: <strong>{currentGroup.strategic_score}</strong>
              </p>
            )}

            <div>
              <div className="max-h-60 overflow-y-auto rounded border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Path</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-600">Views</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-600">Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUrls.map((row) => (
                      <tr key={row.URL} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-1.5">
                          <a
                            href={row.URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-700 underline hover:text-slate-900"
                          >
                            {pathAfterEdu(row.URL) || row.URL}
                          </a>
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-600 tabular-nums">
                          {parseFloat(row.Views || '0').toLocaleString()}
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-600 tabular-nums">
                          {formatEngagement(row['Average engagement time per session'])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagesInYear.length > 5 && (
                <button
                  type="button"
                  onClick={() => setUrlsExpanded((e) => !e)}
                  className="mt-1 text-sm text-slate-600 hover:underline"
                >
                  {urlsExpanded
                    ? 'Show less'
                    : `View all ${pagesInYear.length} pages`}
                </button>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Your decision</label>
              <select
                value={
                  clientDecision && REC_OPTIONS.includes(clientDecision)
                    ? clientDecision
                    : currentGroup.recommendation
                }
                onChange={(e) => setClientDecision(e.target.value as MigrationRecommendation)}
                className="w-fit min-w-[12rem] rounded-md border border-slate-200 bg-white py-2 pl-3 pr-10 text-sm text-slate-800"
              >
                {REC_OPTIONS.map((rec) => (
                  <option key={rec} value={rec}>
                    {rec === currentGroup.recommendation ? 'Agree' : `Change to ${REC_LABELS[rec]}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes…"
                rows={3}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentIndex <= 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
              >
                ← Previous
              </Button>
              <Button type="button" size="sm" onClick={saveDecision}>
                Save decision
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentIndex >= filteredGroups.length - 1}
                onClick={goNext}
                className="ml-auto"
              >
                Skip →
              </Button>
            </div>
          </CardContent>
        </Card>
        </>
      </div>
    </div>
  )
}
