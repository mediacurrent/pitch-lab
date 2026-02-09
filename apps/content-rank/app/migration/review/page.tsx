'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button, Card, CardContent } from '@repo/ui'
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

/** Combined filter option for Adapt + Flag for review. */
const ADAPT_OR_FLAG = 'ADAPT_OR_FLAG' as const

/** Combined filter option for Leave behind + Stale content (filter by year). */
const LEAVE_BEHIND_OR_STALE = 'LEAVE_BEHIND_OR_STALE' as const

/** Filter options shown in the UI. */
const FILTER_OPTIONS = ['MIGRATE', ADAPT_OR_FLAG, LEAVE_BEHIND_OR_STALE] as const

const FILTER_LABELS: Record<string, string> = {
  MIGRATE: 'Migrate',
  [ADAPT_OR_FLAG]: 'Flag for Review',
  [LEAVE_BEHIND_OR_STALE]: 'Leave Behind',
}

const FILTER_COLORS: Record<string, string> = {
  MIGRATE: 'bg-emerald-500',
  [ADAPT_OR_FLAG]: 'bg-amber-500',
  [LEAVE_BEHIND_OR_STALE]: 'bg-rose-500',
}

const FILTER_EXPLAINERS: Partial<Record<string, string>> = {
  MIGRATE: 'Move these pages as is',
  [ADAPT_OR_FLAG]: 'Check rationale and evaluate',
  [LEAVE_BEHIND_OR_STALE]: 'Do not move · filter by year',
}

type RecFilter = 'all' | MigrationRecommendation | typeof ADAPT_OR_FLAG | typeof LEAVE_BEHIND_OR_STALE

const GROUP_SEP = '\u001f'

const QUERY_STRING_GROUP = 'Query string URLs'
const TAG_GROUP = 'Tag URLs'
const ACADEMIC_CALENDAR_LIST_GROUP = 'Academic calendar list'
const CATEGORY_GROUP = 'Category URLs'

/** Show-more categories (recommended Leave behind); filter by url_group. Excluded from Leave behind filter/counts. */
const SHOW_MORE_CATEGORIES = [
  { urlGroup: QUERY_STRING_GROUP, label: 'Query string' },
  { urlGroup: TAG_GROUP, label: 'Tag' },
  { urlGroup: ACADEMIC_CALENDAR_LIST_GROUP, label: 'Academic calendar list' },
  { urlGroup: CATEGORY_GROUP, label: 'Category' },
] as const

const SPECIAL_LEAVE_BEHIND_URL_GROUPS = new Set(SHOW_MORE_CATEGORIES.map((c) => c.urlGroup))

/** Stored decision: always a recommendation. Legacy stale-specific values are normalized when loaded. */
type ClientDecision = MigrationRecommendation

interface ReviewGroup {
  recommendation: MigrationRecommendation
  reason: string
  url_group: string
  count: number
  pages: MigrationRow[]
  strategic_score: string
}

function groupRows(rows: MigrationRow[]): ReviewGroup[] {
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

  if (withQuery.length > 0) {
    const first = withQuery[0]!
    groups.push({
      recommendation: 'LEAVE BEHIND',
      reason: 'URL has query parameters',
      url_group: QUERY_STRING_GROUP,
      count: withQuery.length,
      pages: withQuery,
      strategic_score: first.strategic_score || first.strategic_value || '',
    })
  }

  if (withTag.length > 0) {
    const first = withTag[0]!
    groups.push({
      recommendation: 'LEAVE BEHIND',
      reason: 'URL includes /tag/',
      url_group: TAG_GROUP,
      count: withTag.length,
      pages: withTag,
      strategic_score: first.strategic_score || first.strategic_value || '',
    })
  }

  if (withAcademicCalendar.length > 0) {
    const first = withAcademicCalendar[0]!
    groups.push({
      recommendation: 'LEAVE BEHIND',
      reason: 'URL includes /academic-calendar-list/',
      url_group: ACADEMIC_CALENDAR_LIST_GROUP,
      count: withAcademicCalendar.length,
      pages: withAcademicCalendar,
      strategic_score: first.strategic_score || first.strategic_value || '',
    })
  }

  if (withCategory.length > 0) {
    const first = withCategory[0]!
    groups.push({
      recommendation: 'LEAVE BEHIND',
      reason: 'URL includes /category/',
      url_group: CATEGORY_GROUP,
      count: withCategory.length,
      pages: withCategory,
      strategic_score: first.strategic_score || first.strategic_value || '',
    })
  }

  return groups.sort((a, b) => b.count - a.count)
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
  /** When on Leave behind & Stale, filter groups by single year (e.g. 2020). */
  const [yearFilter, setYearFilter] = useState<'all' | number>('all')
  const [showMoreExpanded, setShowMoreExpanded] = useState(false)
  /** When set, filter to groups with this url_group (Query string, Tag, Academic calendar list — all recommended Leave behind). */
  const [showMoreCategory, setShowMoreCategory] = useState<string | null>(null)

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
    if (showMoreCategory) {
      return groups.filter((g) => g.url_group === showMoreCategory)
    }
    let list: ReviewGroup[]
    if (recFilter === 'all') {
      list = groups
    } else if (recFilter === ADAPT_OR_FLAG) {
      list = groups.filter((g) => g.recommendation === 'ADAPT' || g.recommendation === 'FLAG FOR REVIEW')
    } else if (recFilter === LEAVE_BEHIND_OR_STALE) {
      list = groups.filter(
        (g) =>
          (g.recommendation === 'LEAVE BEHIND' && !SPECIAL_LEAVE_BEHIND_URL_GROUPS.has(g.url_group)) ||
          g.recommendation === 'STALE CONTENT'
      )
      if (yearFilter !== 'all') {
        const year = Number(yearFilter)
        list = list.filter((g) => groupYears(g).includes(year))
      }
    } else {
      list = groups.filter((g) => g.recommendation === recFilter)
    }
    return list
  }, [groups, recFilter, yearFilter, showMoreCategory])

  /** Groups in the Leave behind & Stale category (for year options). */
  const leaveBehindOrStaleGroups = useMemo(
    () =>
      groups.filter(
        (g) =>
          (g.recommendation === 'LEAVE BEHIND' && !SPECIAL_LEAVE_BEHIND_URL_GROUPS.has(g.url_group)) ||
          g.recommendation === 'STALE CONTENT'
      ),
    [groups]
  )

  /** All years present in Leave behind & Stale groups (for View by year). */
  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    for (const g of leaveBehindOrStaleGroups) {
      for (const y of groupYears(g)) {
        if (y > 1945) years.add(y)
      }
    }
    return Array.from(years).sort((a, b) => a - b)
  }, [leaveBehindOrStaleGroups])

  useEffect(() => {
    setCurrentIndex(0)
  }, [recFilter, yearFilter, showMoreCategory])

  const currentGroup = filteredGroups[currentIndex] ?? null

  useEffect(() => {
    setUrlsExpanded(false)
  }, [currentIndex, currentGroup])
  const saved = currentGroup ? decisions[groupKey(currentGroup)] : undefined

  const recCounts = useMemo(() => {
    const c: Record<string, number> = {
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

  /** Counts for the 3 filter buttons (Leave behind & Stale combined; special URL groups excluded from leave-behind). */
  const filterCounts = useMemo(() => {
    const leaveBehind = groups.filter(
      (g) => g.recommendation === 'LEAVE BEHIND' && !SPECIAL_LEAVE_BEHIND_URL_GROUPS.has(g.url_group)
    ).length
    const stale = recCounts['STALE CONTENT'] ?? 0
    return {
      MIGRATE: recCounts['MIGRATE'] ?? 0,
      [ADAPT_OR_FLAG]: (recCounts['ADAPT'] ?? 0) + (recCounts['FLAG FOR REVIEW'] ?? 0),
      [LEAVE_BEHIND_OR_STALE]: leaveBehind + stale,
    }
  }, [groups, recCounts])

  const showMoreCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const { urlGroup } of SHOW_MORE_CATEGORIES) {
      c[urlGroup] = groups.filter((g) => g.url_group === urlGroup).length
    }
    return c
  }, [groups])

  /** Number of groups with a saved decision per category. */
  const decidedCounts = useMemo(() => {
    const c: Record<string, number> = {
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

  /** Decided counts for the 3 filter buttons (Leave behind & Stale combined). */
  const filterDecidedCounts = useMemo(() => {
    const leaveBehind = groups.filter(
      (g) =>
        g.recommendation === 'LEAVE BEHIND' &&
        !SPECIAL_LEAVE_BEHIND_URL_GROUPS.has(g.url_group) &&
        groupKey(g) in decisions
    ).length
    const stale = decidedCounts['STALE CONTENT'] ?? 0
    return {
      MIGRATE: decidedCounts['MIGRATE'] ?? 0,
      [ADAPT_OR_FLAG]: (decidedCounts['ADAPT'] ?? 0) + (decidedCounts['FLAG FOR REVIEW'] ?? 0),
      [LEAVE_BEHIND_OR_STALE]: leaveBehind + stale,
    }
  }, [groups, decisions, decidedCounts])

  useEffect(() => {
    if (saved) {
      const raw = saved.client_decision as string
      const fallback = currentGroup?.recommendation ?? 'FLAG FOR REVIEW'
      setClientDecision(REC_OPTIONS.includes(raw as MigrationRecommendation) ? raw as MigrationRecommendation : fallback)
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
            {FILTER_OPTIONS.map((rec) => (
              <Button
                key={rec}
                variant={!showMoreCategory && recFilter === rec ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setShowMoreCategory(null); setRecFilter(rec) }}
              >
                {FILTER_LABELS[rec]} ({filterCounts[rec] ?? 0})
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

  /** When View by year is set (Leave behind & Stale), only pages whose URL contains that year. */
  const pagesInYear =
    recFilter === LEAVE_BEHIND_OR_STALE && yearFilter !== 'all'
      ? currentGroup.pages.filter((row) =>
          extractYearsFromUrl(row.URL).includes(Number(yearFilter))
        )
      : currentGroup.pages

  const displayedUrls = urlsExpanded ? pagesInYear : pagesInYear.slice(0, 5)
  const isYearFilterActive = recFilter === LEAVE_BEHIND_OR_STALE && yearFilter !== 'all'

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
            {showMoreCategory
              ? ` (${SHOW_MORE_CATEGORIES.find((c) => c.urlGroup === showMoreCategory)?.label ?? showMoreCategory})`
              : recFilter !== 'all'
                ? ` (${(FILTER_LABELS[recFilter] ?? REC_LABELS[recFilter])} only)`
                : ''}{' '}
            · {Object.keys(decisions).length} saved
          </p>
        </header>

        <>
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Review by recommendation</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                {FILTER_OPTIONS.map((rec) => {
                  const total = filterCounts[rec] ?? 0
                  const done = filterDecidedCounts[rec] ?? 0
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0
                  return (
                    <div key={rec} className="min-w-0 flex flex-col gap-1.5">
                      <Button
                        variant={!showMoreCategory && recFilter === rec ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setShowMoreCategory(null)
                          setRecFilter(rec)
                        }}
                        className="w-full justify-center"
                      >
                        {FILTER_LABELS[rec]}
                      </Button>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span className="font-medium truncate">{FILTER_LABELS[rec]}</span>
                        <span className="tabular-nums shrink-0">{done}/{total}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-[width] duration-200 ${FILTER_COLORS[rec]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {FILTER_EXPLAINERS[rec] && (
                        <p className="text-xs text-slate-500 leading-tight">
                          {FILTER_EXPLAINERS[rec]}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowMoreExpanded((e) => !e)}
                  className="text-sm text-slate-600 hover:text-slate-900 underline"
                >
                  {showMoreExpanded ? 'Hide' : 'Show'} weird URL categories
                </button>
                {showMoreExpanded && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SHOW_MORE_CATEGORIES.map(({ urlGroup, label }) => {
                      const count = showMoreCounts[urlGroup] ?? 0
                      if (count === 0) return null
                      return (
                        <Button
                          key={urlGroup}
                          variant={showMoreCategory === urlGroup ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setShowMoreCategory(showMoreCategory === urlGroup ? null : urlGroup)}
                        >
                          {label}
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
              {recFilter === LEAVE_BEHIND_OR_STALE && yearOptions.length > 0 && !showMoreCategory && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-600">View by year</span>
                  <select
                    value={yearFilter === 'all' ? 'all' : String(yearFilter)}
                    onChange={(e) => {
                      const v = e.target.value
                      setYearFilter(v === 'all' ? 'all' : parseInt(v, 10))
                    }}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800"
                  >
                    <option value="all">All years</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <Card>
          <CardContent className="space-y-4 pt-6">
            <p>
              <strong>
                {isYearFilterActive
                  ? `${pagesInYear.length} of ${currentGroup.count} pages (${yearFilter} only)`
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
