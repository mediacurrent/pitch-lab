'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
} from '@repo/ui'
import {
  parseMigrationCSV,
  formatEngagement,
  pathAfterEdu,
  type MigrationRow,
  type MigrationRecommendation,
} from '../lib/parseMigrationCSV'

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

type RecFilter = 'all' | MigrationRecommendation

const VERSION_STORAGE_KEY = 'migration-data-version'

function MigrationPageInner() {
  const [data, setData] = useState<MigrationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [versions, setVersions] = useState<string[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const searchParams = useSearchParams()
  const [recFilter, setRecFilter] = useState<RecFilter>('all')
  const [urlGroupFilter, setUrlGroupFilter] = useState<string>(
    () => searchParams.get('url_group') ?? ''
  )

  useEffect(() => {
    const ug = searchParams.get('url_group')
    if (ug) setUrlGroupFilter(ug)
  }, [searchParams])
  const [sortBy, setSortBy] = useState<'recommendation' | 'Views' | 'url_group' | 'path'>('recommendation')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetch('/api/migration-data?list=1')
      .then((r) => r.json())
      .then((body: { versions?: string[] }) => {
        const list = body.versions ?? []
        setVersions(list)
        if (list.length > 0) {
          const stored = typeof window !== 'undefined' ? localStorage.getItem(VERSION_STORAGE_KEY) : null
          const version = (stored && list.includes(stored) ? stored : list[0]) ?? ''
          setSelectedVersion(version)
          if (typeof window !== 'undefined' && version) localStorage.setItem(VERSION_STORAGE_KEY, version)
        } else {
          setLoading(false)
        }
      })
      .catch(() => {
        setVersions([])
        setLoading(false)
      })
  }, [])

  const loadCSV = useCallback(async () => {
    if (!selectedVersion) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/migration-data?version=${encodeURIComponent(selectedVersion)}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const csv = await res.text()
      setData(parseMigrationCSV(csv))
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to load migration data'
      )
      setData([])
    } finally {
      setLoading(false)
    }
  }, [selectedVersion])

  useEffect(() => {
    if (selectedVersion) {
      loadCSV()
    } else if (versions.length === 0) {
      setLoading(false)
    }
  }, [selectedVersion, loadCSV, versions.length])

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version)
    if (typeof window !== 'undefined') localStorage.setItem(VERSION_STORAGE_KEY, version)
  }

  const urlGroups = useMemo(() => {
    const set = new Set<string>()
    for (const row of data) set.add(row.url_group)
    return Array.from(set).sort()
  }, [data])

  const filteredData = useMemo(() => {
    let rows = data
    if (recFilter !== 'all') {
      rows = rows.filter((r) => r.recommendation === recFilter)
    }
    if (urlGroupFilter) {
      rows = rows.filter((r) => r.url_group === urlGroupFilter)
    }
    return [...rows].sort((a, b) => {
      let diff = 0
      if (sortBy === 'recommendation') {
        diff = (a.recommendation ?? '').localeCompare(b.recommendation ?? '')
      } else if (sortBy === 'url_group') {
        diff = (a.url_group ?? '').localeCompare(b.url_group ?? '')
      } else if (sortBy === 'Views') {
        diff = parseFloat(a.Views || '0') - parseFloat(b.Views || '0')
      } else if (sortBy === 'path') {
        diff = pathAfterEdu(a.URL).localeCompare(pathAfterEdu(b.URL))
      }
      return sortDir === 'asc' ? diff : -diff
    })
  }, [data, recFilter, urlGroupFilter, sortBy, sortDir])

  const recCounts = useMemo(() => {
    const c: Record<MigrationRecommendation, number> = {
      MIGRATE: 0,
      ADAPT: 0,
      'FLAG FOR REVIEW': 0,
      'LEAVE BEHIND': 0,
      'STALE CONTENT': 0,
    }
    for (const row of data) {
      const rec = row.recommendation
      if (rec in c) c[rec] = (c[rec] ?? 0) + 1
    }
    return c
  }, [data])

  const handleExport = useCallback(() => {
    const header = [
      'URL',
      'Title',
      'url_group',
      'recommendation',
      'reason',
      'Views',
      'Engagement',
      'strategic_value',
      'strategic_score',
    ]
    const lines = [
      header.join(','),
      ...filteredData.map((r) =>
        [
          `"${(r.URL ?? '').replace(/"/g, '""')}"`,
          `"${(r['Title 1'] ?? '').replace(/"/g, '""')}"`,
          `"${(r.url_group ?? '').replace(/"/g, '""')}"`,
          r.recommendation ?? '',
          `"${(r.reason ?? '').replace(/"/g, '""')}"`,
          r.Views ?? '',
          r['Average engagement time per session'] ?? '',
          `"${(r.strategic_value ?? '').replace(/"/g, '""')}"`,
          r.strategic_score ?? '',
        ].join(',')
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const u = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = u
    a.download = 'migration-filtered.csv'
    a.click()
    URL.revokeObjectURL(u)
  }, [filteredData])

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else setSortBy(key)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading migration data…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <h2 className="text-lg font-semibold text-rose-800">Error</h2>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">{error}</p>
            <Button variant="outline" size="sm" onClick={loadCSV} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Content Migration Analyzer (NYSID)
              </h1>
              <p className="mt-2 text-slate-600">
                {data.length} pages from migration analysis. Filter, sort, and export.
              </p>
            </div>
            {versions.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span>Data version:</span>
                <select
                  value={selectedVersion}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 pr-8 text-slate-800"
                >
                  {versions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={recFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecFilter('all')}
            >
              All ({data.length})
            </Button>
            {(Object.keys(recCounts) as MigrationRecommendation[])
              .map((rec) => (
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
          <select
            value={urlGroupFilter}
            onChange={(e) => setUrlGroupFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
          >
            <option value="">All URL groups</option>
            {urlGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            Export filtered CSV
          </Button>
          <Link href="/migration/review">
            <Button size="sm">Group review</Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      <button
                        onClick={() => toggleSort('path')}
                        className="hover:text-slate-900"
                      >
                        Path {sortBy === 'path' && (sortDir === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      <button
                        onClick={() => toggleSort('url_group')}
                        className="hover:text-slate-900"
                      >
                        URL group {sortBy === 'url_group' && (sortDir === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      <button
                        onClick={() => toggleSort('recommendation')}
                        className="hover:text-slate-900"
                      >
                        Recommendation {sortBy === 'recommendation' && (sortDir === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-slate-700">
                      <button
                        onClick={() => toggleSort('Views')}
                        className="hover:text-slate-900"
                      >
                        Views {sortBy === 'Views' && (sortDir === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-slate-700">
                      Engagement
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Strategic
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 200).map((row, i) => (
                    <tr
                      key={row.URL + i}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2">
                        <a
                          href={row.URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-700 underline hover:text-slate-900"
                        >
                          {pathAfterEdu(row.URL) || row.URL}
                        </a>
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {row.url_group}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${REC_COLORS[row.recommendation] ?? 'bg-slate-100'}`}
                        >
                          {REC_LABELS[row.recommendation] ?? row.recommendation}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-4 py-2 text-slate-600">
                        {row.reason}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-600">
                        {parseFloat(row.Views || '0').toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-600">
                        {formatEngagement(row['Average engagement time per session'])}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {row.strategic_value || row.strategic_score || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length > 200 && (
              <p className="px-4 py-3 text-sm text-slate-500 border-t border-slate-200">
                Showing 200 of {filteredData.length} rows. Use filters to narrow.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-500">Loading…</p></div>}>
      <MigrationPageInner />
    </Suspense>
  )
}
