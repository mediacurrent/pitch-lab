'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Category = 'KEEP' | 'KILL' | 'MERGE'

interface RankedPage {
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

interface ContentRankInstance {
  id: string
  title?: string | null
}

interface CategorizeOptions {
  topTrafficPercent: number
  nearZeroViews: number
  thinContentWords: number
  fewInlinks: number
  lowEngagementSec: number
}

const DEFAULT_OPTIONS: CategorizeOptions = {
  topTrafficPercent: 25,
  nearZeroViews: 10,
  thinContentWords: 300,
  fewInlinks: 2,
  lowEngagementSec: 5,
}

type Tab = 'all' | 'KEEP' | 'KILL' | 'MERGE'
type SortKey = 'views' | 'engagementTimeSec' | 'wordCount' | 'inlinks' | 'path'

const REASON_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'Top', label: 'Top traffic' },
  { value: 'Strong inbound', label: 'Strong inbound links' },
  { value: 'Solid content', label: 'Solid content' },
  { value: 'Good engagement', label: 'Good engagement' },
  { value: 'Very low traffic', label: 'Very low traffic' },
  { value: 'Thin content', label: 'Thin content' },
  { value: 'Low engagement', label: 'Low engagement' },
  { value: 'Few internal', label: 'Few internal links' },
  { value: 'Moderate traffic', label: 'Moderate traffic' },
  { value: 'Review manually', label: 'Review manually' },
  { value: 'Multiple low-quality', label: 'Multiple low-quality signals' },
]

function ContentRankPageInner() {
  const searchParams = useSearchParams()
  const [clientParams, setClientParams] = useState<{ id: string | null; token: string | null } | null>(null)

  // useSearchParams can be empty during SSR/initial client render; fallback to window.location
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setClientParams({ id: params.get('id'), token: params.get('token') })
    }
  }, [])

  const getParam = (key: 'id' | 'token') => {
    const fromRouter = searchParams.get(key)
    if (fromRouter) return fromRouter
    if (clientParams?.[key]) return clientParams[key]
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get(key)
    }
    return null
  }
  const instanceId = getParam('id')
  const token = getParam('token')

  const [instance, setInstance] = useState<ContentRankInstance | null>(null)
  const [pages, setPages] = useState<RankedPage[]>([])
  const [options, setOptions] = useState<CategorizeOptions>(DEFAULT_OPTIONS)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('all')
  const [sortBy, setSortBy] = useState<SortKey>('views')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [groupBySection, setGroupBySection] = useState(false)
  const [expandedReasonsId, setExpandedReasonsId] = useState<string | null>(null)
  const [reasonFilters, setReasonFilters] = useState<Set<string>>(new Set())
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)
  const filterDropdownRef = useRef<HTMLDivElement>(null)
  const exportDropdownRef = useRef<HTMLDivElement>(null)

  const getPathSection = (path: string) => {
    const segment = path.replace(/^\/+|\/+$/g, '').split('/')[0]
    return segment || '(root)'
  }

  const buildResultUrl = useCallback(
    (opts?: CategorizeOptions) => {
      const p = opts ?? options
      const params = new URLSearchParams()
      params.set('id', instanceId ?? '')
      params.set('token', token ?? '')
      params.set('topTrafficPercent', String(p.topTrafficPercent))
      params.set('nearZeroViews', String(p.nearZeroViews))
      params.set('thinContentWords', String(p.thinContentWords))
      params.set('fewInlinks', String(p.fewInlinks))
      params.set('lowEngagementSec', String(p.lowEngagementSec))
      return `/api/result?${params.toString()}`
    },
    [instanceId, token, options],
  )

  const loadInstance = useCallback(async () => {
    if (!instanceId || !token) {
      setStatus(
        instanceId && !token
          ? 'This instance has no access token. Contact your administrator to run the fix-content-rank-tokens script in the CMS.'
          : 'Open a Content Rank from your dashboard to view an instance.',
      )
      return
    }
    setStatus('Loading...')
    setError(null)
    try {
      const [instanceRes, resultRes] = await Promise.all([
        fetch(`/api/instance?id=${encodeURIComponent(instanceId)}&token=${encodeURIComponent(token)}`),
        fetch(buildResultUrl()),
      ])
      const instanceData = await instanceRes.json()
      const resultData = await resultRes.json()

      if (!instanceRes.ok) {
        setError(instanceData.error || 'Failed to load')
        setStatus('')
        return
      }
      setInstance(instanceData)

      if (!resultRes.ok) {
        setError(resultData.error ?? 'Failed to load analyzed data')
        setStatus('')
        return
      }
      setPages(resultData.pages ?? [])
      setStatus('')
    } catch {
      setError('Failed to load')
      setStatus('')
    }
  }, [instanceId, token, buildResultUrl])

  useEffect(() => {
    loadInstance()
  }, [loadInstance])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        filterDropdownRef.current?.contains(target) ||
        exportDropdownRef.current?.contains(target)
      ) return
      setFilterDropdownOpen(false)
      setExportDropdownOpen(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])


  const tabFiltered =
    tab === 'all'
      ? pages
      : pages.filter((r) => r.category === tab)

  const filtered =
    reasonFilters.size === 0
      ? tabFiltered
      : tabFiltered.filter((r) =>
          r.reasons.some((reason) =>
            [...reasonFilters].some((f) => reason.toLowerCase().includes(f.toLowerCase())),
          ),
        )

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortBy] ?? 0
    const vb = b[sortBy] ?? 0
    if (typeof va === 'string' && typeof vb === 'string') {
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    }
    const diff = (Number(va) - Number(vb)) * (sortDir === 'asc' ? 1 : -1)
    return diff
  })

  const groupedBySection = groupBySection
    ? sorted.reduce(
        (acc, row) => {
          const section = getPathSection(row.path)
          if (!acc[section]) acc[section] = []
          acc[section].push(row)
          return acc
        },
        {} as Record<string, typeof sorted>,
      )
    : null

  const keepCount = pages.filter((r) => r.category === 'KEEP').length
  const killCount = pages.filter((r) => r.category === 'KILL').length
  const mergeCount = pages.filter((r) => r.category === 'MERGE').length

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else setSortBy(key)
  }

  const exportCsv = useCallback(
    (category: 'KEEP' | 'KILL' | 'MERGE' | 'all') => {
      const filtered = category === 'all' ? pages : pages.filter((r) => r.category === category)
      if (filtered.length === 0) return
      const rows = filtered.map((r) => ({
        url: r.url,
        path: r.path,
        category: r.category,
        views: r.views,
        engagementTimeSec: r.engagementTimeSec.toFixed(1),
        wordCount: r.wordCount,
        inlinks: r.inlinks,
        reasons: r.reasons.join('; '),
      }))
      const header = Object.keys(rows[0]!).join(',')
      const body = rows
        .map((r) =>
          Object.values(r)
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(','),
        )
        .join('\n')
      const csv = `${header}\n${body}`
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `page-audit-${category === 'all' ? 'all' : category.toLowerCase()}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    },
    [pages],
  )

  const updateOption = (key: keyof CategorizeOptions, value: number) => {
    setOptions((o) => ({ ...o, [key]: value }))
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold text-slate-900">Page Audit</h1>
          <p className="text-red-600" role="alert">
            {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {instance?.title || status || 'Page Audit'}
          </h1>
          <p className="mt-2 text-slate-600">
            Combine Screaming Frog URL data with GA4 Exploration exports and categorize pages into{' '}
            <strong className="text-emerald-600">KEEP</strong>, <strong className="text-rose-600">KILL</strong>, and{' '}
            <strong className="text-amber-600">MERGE</strong>.
          </p>
        </header>

        {instance && pages.length > 0 && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 mb-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Thresholds</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Top traffic % (KEEP)</label>
                <input
                  type="number"
                  min={10}
                  max={50}
                  value={options.topTrafficPercent}
                  onChange={(e) => updateOption('topTrafficPercent', Number(e.target.value) || 25)}
                  className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Near-zero views (KILL)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={options.nearZeroViews}
                  onChange={(e) => updateOption('nearZeroViews', Number(e.target.value) || 10)}
                  className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Thin content (words)</label>
                <input
                  type="number"
                  min={100}
                  max={1000}
                  value={options.thinContentWords}
                  onChange={(e) => updateOption('thinContentWords', Number(e.target.value) || 300)}
                  className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Few inlinks (KILL)</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={options.fewInlinks}
                  onChange={(e) => updateOption('fewInlinks', Number(e.target.value) || 2)}
                  className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Low engagement (sec)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={options.lowEngagementSec}
                  onChange={(e) => updateOption('lowEngagementSec', Number(e.target.value) || 5)}
                  className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-4 mb-8">
          <button
            type="button"
            onClick={async () => {
              if (!instanceId || !token) return
              setStatus('Re-running...')
              try {
                const r = await fetch(buildResultUrl())
                const d = await r.json()
                if (r.ok) setPages(d.pages ?? [])
                else setError(d.error ?? 'Failed to run analysis')
              } catch {
                setError('Failed to run analysis')
              }
              setStatus('')
            }}
            disabled={!instanceId || !token || status !== ''}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition"
          >
            Run analysis
          </button>
          {status && <p className="text-slate-500 text-sm">{status}</p>}
        </div>

        {pages.length > 0 && (
          <section className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2 items-center">
                {(['all', 'KEEP', 'KILL', 'MERGE'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      tab === t
                        ? t === 'KEEP'
                          ? 'bg-emerald-600 text-white'
                          : t === 'KILL'
                            ? 'bg-rose-600 text-white'
                            : t === 'MERGE'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {t === 'all' ? 'All' : t}
                    {t === 'all' && ` (${pages.length})`}
                    {t === 'KEEP' && ` (${keepCount})`}
                    {t === 'KILL' && ` (${killCount})`}
                    {t === 'MERGE' && ` (${mergeCount})`}
                  </button>
                ))}
                <div className="relative" ref={filterDropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFilterDropdownOpen((o) => !o); setExportDropdownOpen(false); }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 flex items-center gap-1"
                  >
                    Filter: {reasonFilters.size === 0 ? 'All reasons' : `${reasonFilters.size} selected`}
                    <span className="text-slate-400">▾</span>
                  </button>
                  {filterDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 z-10 min-w-[220px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg max-h-[320px] overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => setReasonFilters(new Set())}
                        className="w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 border-b border-slate-100"
                      >
                        Clear all
                      </button>
                      {REASON_FILTER_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 text-slate-600"
                        >
                          <input
                            type="checkbox"
                            checked={reasonFilters.has(opt.value)}
                            onChange={() => {
                              setReasonFilters((prev) => {
                                const next = new Set(prev)
                                if (next.has(opt.value)) next.delete(opt.value)
                                else next.add(opt.value)
                                return next
                              })
                            }}
                            className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setGroupBySection((g) => !g)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    groupBySection ? 'bg-slate-600 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {groupBySection ? 'Flat list' : 'Group by section'}
                </button>
                <div className="relative" ref={exportDropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setExportDropdownOpen((o) => !o); setFilterDropdownOpen(false); }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 flex items-center gap-1"
                  >
                    Export CSV
                    <span className="text-slate-400">▾</span>
                  </button>
                  {exportDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 z-10 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => { exportCsv('all'); setExportDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => { exportCsv('KEEP'); setExportDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50"
                      >
                        KEEP
                      </button>
                      <button
                        type="button"
                        onClick={() => { exportCsv('KILL'); setExportDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                      >
                        KILL
                      </button>
                      <button
                        type="button"
                        onClick={() => { exportCsv('MERGE'); setExportDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-amber-600 hover:bg-amber-50"
                      >
                        MERGE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 text-slate-600 font-medium">Category</th>
                    <th
                      className="text-left py-3 px-4 text-slate-600 font-medium cursor-pointer hover:text-slate-900"
                      onClick={() => toggleSort('path')}
                    >
                      URL / Path {sortBy === 'path' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 px-4 text-slate-600 font-medium cursor-pointer hover:text-slate-900"
                      onClick={() => toggleSort('views')}
                    >
                      Views {sortBy === 'views' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 px-4 text-slate-600 font-medium cursor-pointer hover:text-slate-900"
                      onClick={() => toggleSort('engagementTimeSec')}
                    >
                      Engagement {sortBy === 'engagementTimeSec' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 px-4 text-slate-600 font-medium cursor-pointer hover:text-slate-900"
                      onClick={() => toggleSort('wordCount')}
                    >
                      Words {sortBy === 'wordCount' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 px-4 text-slate-600 font-medium cursor-pointer hover:text-slate-900"
                      onClick={() => toggleSort('inlinks')}
                    >
                      Inlinks {sortBy === 'inlinks' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-3 px-4 text-slate-600 font-medium">Reasons</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedBySection
                    ? Object.entries(groupedBySection)
                        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                        .flatMap(([section, rows]) => [
                          <tr key={`section-${section}`} className="bg-slate-100/80 border-b border-slate-200">
                            <td colSpan={7} className="py-2.5 px-4 text-sm font-semibold text-slate-700">
                              {section === '(root)' ? '/' : `/${section}/`} ({rows.length} page{rows.length !== 1 ? 's' : ''})
                            </td>
                          </tr>,
                          ...rows.map((row) => (
                            <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-2 px-4">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                    row.category === 'KEEP'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : row.category === 'KILL'
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  {row.category}
                                </span>
                              </td>
                              <td className="py-2 px-4 max-w-[280px] truncate" title={row.url}>
                                <a
                                  href={row.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-600 hover:underline truncate block"
                                >
                                  {row.path || row.url}
                                </a>
                              </td>
                              <td className="py-2 px-4 text-right tabular-nums">{row.views.toLocaleString()}</td>
                              <td className="py-2 px-4 text-right tabular-nums">
                                {row.engagementTimeSec >= 60
                                  ? `${(row.engagementTimeSec / 60).toFixed(1)}m`
                                  : `${row.engagementTimeSec.toFixed(0)}s`}
                              </td>
                              <td className="py-2 px-4 text-right tabular-nums">{row.wordCount}</td>
                              <td className="py-2 px-4 text-right tabular-nums">{row.inlinks}</td>
                              <td
                                className={`py-2 px-4 text-slate-600 cursor-pointer hover:bg-slate-100 transition ${
                                  expandedReasonsId === row.id ? '' : 'max-w-[200px] truncate'
                                }`}
                                onClick={() => setExpandedReasonsId((id) => (id === row.id ? null : row.id))}
                                title={expandedReasonsId === row.id ? 'Click to collapse' : 'Click to expand'}
                              >
                                {expandedReasonsId === row.id ? (
                                  <ul className="list-disc list-inside space-y-1 text-left">
                                    {row.reasons.map((r, i) => (
                                      <li key={i}>{r}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  row.reasons.join(' · ')
                                )}
                              </td>
                            </tr>
                          )),
                        ])
                    : sorted.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                row.category === 'KEEP'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : row.category === 'KILL'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {row.category}
                            </span>
                          </td>
                          <td className="py-2 px-4 max-w-[280px] truncate" title={row.url}>
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline truncate block"
                            >
                              {row.path || row.url}
                            </a>
                          </td>
                          <td className="py-2 px-4 text-right tabular-nums">{row.views.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right tabular-nums">
                            {row.engagementTimeSec >= 60
                              ? `${(row.engagementTimeSec / 60).toFixed(1)}m`
                              : `${row.engagementTimeSec.toFixed(0)}s`}
                          </td>
                          <td className="py-2 px-4 text-right tabular-nums">{row.wordCount}</td>
                          <td className="py-2 px-4 text-right tabular-nums">{row.inlinks}</td>
                          <td
                            className={`py-2 px-4 text-slate-600 cursor-pointer hover:bg-slate-100 transition ${
                              expandedReasonsId === row.id ? '' : 'max-w-[200px] truncate'
                            }`}
                            onClick={() => setExpandedReasonsId((id) => (id === row.id ? null : row.id))}
                            title={expandedReasonsId === row.id ? 'Click to collapse' : 'Click to expand'}
                          >
                            {expandedReasonsId === row.id ? (
                              <ul className="list-disc list-inside space-y-1 text-left">
                                {row.reasons.map((r, i) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            ) : (
                              row.reasons.join(' · ')
                            )}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            <p className="p-3 text-xs text-slate-500 border-t border-slate-200">
              {sorted.length} page{sorted.length !== 1 ? 's' : ''} shown
              {reasonFilters.size > 0 &&
                ` (${reasonFilters.size} filter${reasonFilters.size !== 1 ? 's' : ''}: ${REASON_FILTER_OPTIONS.filter((o) => reasonFilters.has(o.value)).map((o) => o.label).join(', ')})`}
              . Click column headers to sort. Click Reasons to expand.
            </p>
          </section>
        )}

        {instance && pages.length === 0 && !status && (
          <p className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-slate-600 shadow-sm">
            No data yet. Ensure both Screaming Frog and GA4 CSVs are uploaded in the CMS admin, then re-open.
          </p>
        )}

        {!instance && !status && (
          <p className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-slate-600 shadow-sm">
            Open a Content Rank from your dashboard to view an instance.
          </p>
        )}
      </div>
    </div>
  )
}

export default function ContentRankPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <p className="text-slate-500">Loading...</p>
        </div>
      }
    >
      <ContentRankPageInner />
    </Suspense>
  )
}
