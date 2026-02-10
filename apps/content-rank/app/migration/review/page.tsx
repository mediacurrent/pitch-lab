'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button, Card, CardContent } from '@repo/ui'
import { parseMigrationCSV, pathAfterEdu, formatEngagement, extractYearsFromUrl } from '@/lib/parseMigrationCSV'
import type { MigrationRow, MigrationRecommendation } from '@/lib/parseMigrationCSV'
import { REC_COLORS, REC_LABELS, REC_OPTIONS } from '@/lib/migrationConstants'
import {
  groupRows,
  groupKey,
  groupYears,
  SHOW_MORE_CATEGORIES,
  SPECIAL_LEAVE_BEHIND_URL_GROUPS,
  type ReviewGroup,
} from '@/lib/groupMigrationRows'

/** Combined filter option for Adapt + Flag for review. */
const ADAPT_OR_FLAG = 'ADAPT_OR_FLAG' as const

/** Combined filter option for Leave behind + Stale content. */
const LEAVE_BEHIND_OR_STALE = 'LEAVE_BEHIND_OR_STALE' as const

const FILTER_OPTIONS = ['MIGRATE', ADAPT_OR_FLAG, LEAVE_BEHIND_OR_STALE] as const

const FILTER_LABELS: Record<string, string> = {
  MIGRATE: 'Migrate',
  [ADAPT_OR_FLAG]: 'Flagged for Review',
  [LEAVE_BEHIND_OR_STALE]: 'Leave Behind',
}

const FILTER_COLORS: Record<string, string> = {
  MIGRATE: 'bg-emerald-500',
  [ADAPT_OR_FLAG]: 'bg-amber-500',
  [LEAVE_BEHIND_OR_STALE]: 'bg-rose-500',
}

const FILTER_EXPLAINERS: Partial<Record<string, string>> = {
  MIGRATE: 'Move these pages as is',
  [ADAPT_OR_FLAG]: 'Check rationale and determine migration status',
  [LEAVE_BEHIND_OR_STALE]: 'Do not migrate',
}

type RecFilter = 'all' | MigrationRecommendation | typeof ADAPT_OR_FLAG | typeof LEAVE_BEHIND_OR_STALE

/** Stored decision: always a recommendation. */
type ClientDecision = MigrationRecommendation

const STORAGE_KEY = 'nysid-review-decisions'
const VERSION_STORAGE_KEY = 'migration-data-version'
const SESSION_STORAGE_KEY = 'nysid-migration-session'
const SESSION_EMAIL_KEY = 'nysid-migration-email'

function loadDecisions(): Record<string, { client_decision: ClientDecision; notes: string }> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function loadStoredSession(): { sessionId: string; email: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const sessionId = localStorage.getItem(SESSION_STORAGE_KEY)
    const email = localStorage.getItem(SESSION_EMAIL_KEY)
    if (sessionId && email) return { sessionId, email }
    return null
  } catch {
    return null
  }
}

function GroupReviewPageContent() {
  const [data, setData] = useState<MigrationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [versions, setVersions] = useState<string[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [decisions, setDecisions] = useState<
    Record<string, { client_decision: ClientDecision; notes: string }>
  >({})
  const [clientDecision, setClientDecision] = useState<ClientDecision | null>(null)
  const [notes, setNotes] = useState('')
  const [recFilter, setRecFilter] = useState<RecFilter>('MIGRATE')
  const [urlsExpanded, setUrlsExpanded] = useState(false)
  const [yearFilter, setYearFilter] = useState<'all' | number>('all')
  const [showMoreExpanded, setShowMoreExpanded] = useState(false)
  const [showMoreCategory, setShowMoreCategory] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionSyncStatus, setSessionSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle')
  const [copyResumeStatus, setCopyResumeStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [emailInput, setEmailInput] = useState('')

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
      if (!res.ok) throw new Error('Failed to load')
      const csv = await res.text()
      setData(parseMigrationCSV(csv))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
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

  useEffect(() => {
    setDecisions(loadDecisions())
  }, [])

  const searchParams = useSearchParams()
  const sessionLoadedRef = useRef(false)

  useEffect(() => {
    if (sessionLoadedRef.current || typeof window === 'undefined') return
    const fromUrl = searchParams.get('sessionId')?.trim()
    const stored = loadStoredSession()
    const sid = fromUrl || stored?.sessionId
    const em = stored?.email ?? ''
    if (em) setEmail(em)
    if (sid) {
      setSessionId(sid)
      if (fromUrl) {
        localStorage.setItem(SESSION_STORAGE_KEY, sid)
        if (em) localStorage.setItem(SESSION_EMAIL_KEY, em)
      }
      sessionLoadedRef.current = true
      fetch(`/api/migration-data?sessionId=${encodeURIComponent(sid)}`)
        .then((r) => {
          const isBadGateway = r.status === 502 || r.status === 503
          return r.json().then((body: { error?: string; details?: string; decisions?: Record<string, { client_decision: string; notes: string }>; email?: string }) => {
            if (isBadGateway && body?.error) setSessionError(body.error)
            return body
          })
        })
        .then((body: { decisions?: Record<string, { client_decision: string; notes: string }>; email?: string }) => {
          if (body.email) {
            setEmail(body.email)
            if (typeof window !== 'undefined') localStorage.setItem(SESSION_EMAIL_KEY, body.email)
          }
          if (body.decisions && Object.keys(body.decisions).length > 0) {
            const merged: Record<string, { client_decision: ClientDecision; notes: string }> = { ...loadDecisions() }
            for (const [k, v] of Object.entries(body.decisions)) {
              merged[k] = {
                client_decision: (REC_OPTIONS.includes(v.client_decision as MigrationRecommendation) ? v.client_decision : 'FLAG FOR REVIEW') as ClientDecision,
                notes: v.notes ?? '',
              }
            }
            setDecisions(merged)
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {})
    }
  }, [searchParams])

  const startSession = useCallback(async () => {
    const em = emailInput.trim().toLowerCase()
    if (!em) return
    setSessionLoading(true)
    setSessionError(null)
    try {
      const res = await fetch('/api/migration-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to start session')
      const sid = data.sessionId
      const gotEmail = data.email ?? em
      setSessionId(sid)
      setEmail(gotEmail)
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, sid)
        localStorage.setItem(SESSION_EMAIL_KEY, gotEmail)
      }
    } catch (e) {
      setSessionError(e instanceof Error ? e.message : 'Failed to start session')
    } finally {
      setSessionLoading(false)
    }
  }, [emailInput])

  const syncDecisionsToSession = useCallback(
    async (decisionsPayload: Record<string, { client_decision: ClientDecision; notes: string }>) => {
      if (!sessionId) return
      setSessionSyncStatus('syncing')
      try {
        const body: { sessionId: string; email?: string; dataVersion?: string; decisions: typeof decisionsPayload } = {
          sessionId,
          dataVersion: selectedVersion || undefined,
          decisions: decisionsPayload,
        }
        if (email) body.email = email
        const res = await fetch('/api/migration-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          setSessionSyncStatus('saved')
          setTimeout(() => setSessionSyncStatus('idle'), 2000)
        } else {
          setSessionSyncStatus('error')
        }
      } catch {
        setSessionSyncStatus('error')
      }
    },
    [sessionId, email, selectedVersion]
  )

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!sessionId || !email || Object.keys(decisions).length === 0) return
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      syncTimeoutRef.current = null
      syncDecisionsToSession(decisions)
    }, 1500)
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    }
  }, [sessionId, email, decisions, syncDecisionsToSession])

  const exitSession = useCallback(() => {
    setSessionId(null)
    setEmail('')
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      localStorage.removeItem(SESSION_EMAIL_KEY)
    }
  }, [])

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

  /** True when every group has a saved decision. */
  const allGroupsReviewed = useMemo(
    () => groups.length > 0 && groups.every((g) => groupKey(g) in decisions),
    [groups, decisions]
  )

  /** Summary of decisions: how many groups the user decided as Migrate, Flagged for Review, etc. */
  const summaryByDecision = useMemo(() => {
    const c: Record<string, number> = {
      MIGRATE: 0,
      ADAPT: 0,
      'FLAG FOR REVIEW': 0,
      'LEAVE BEHIND': 0,
      'STALE CONTENT': 0,
    }
    for (const g of groups) {
      const key = groupKey(g)
      const d = decisions[key]
      if (d?.client_decision && d.client_decision in c) {
        c[d.client_decision] = (c[d.client_decision] ?? 0) + 1
      }
    }
    return c
  }, [groups, decisions])

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

  if (error || (groups.length === 0 && selectedVersion)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-slate-600">{error || 'No groups to review.'}</p>
            {versions.length > 0 && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => loadCSV()}>
                Retry
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (versions.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-slate-600">No migration data versions found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasSessionFromUrl = Boolean(searchParams.get('sessionId')?.trim())
  if (!sessionId && !hasSessionFromUrl && versions.length > 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Content Migration Analyzer</h1>
            <p className="text-slate-600 mb-4">
              Enter your email to start a review session. Your progress will be saved and you can resume on another device.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                startSession()
              }}
              className="space-y-3"
            >
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400"
                required
                autoComplete="email"
              />
              {sessionError && (
                <p className="text-sm text-red-600">{sessionError}</p>
              )}
              <Button type="submit" disabled={sessionLoading}>
                {sessionLoading ? 'Starting…' : 'Start session'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!selectedVersion && versions.length > 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    )
  }

  if (filteredGroups.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900">Content Migration Analyzer</h1>
            <div className="flex flex-col items-end">
              <Button variant="outline" size="sm" onClick={exitSession}>
                Exit Session
              </Button>
              {selectedVersion && (
                <p className="mt-2 text-sm text-slate-600">
                  Data version: {selectedVersion}
                </p>
              )}
            </div>
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
        </div>
      </div>
    )
  }

  if (allGroupsReviewed) {
    const summaryCombined = {
      MIGRATE: summaryByDecision['MIGRATE'] ?? 0,
      [ADAPT_OR_FLAG]: (summaryByDecision['ADAPT'] ?? 0) + (summaryByDecision['FLAG FOR REVIEW'] ?? 0),
      [LEAVE_BEHIND_OR_STALE]: (summaryByDecision['LEAVE BEHIND'] ?? 0) + (summaryByDecision['STALE CONTENT'] ?? 0),
    }
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900">Content Migration Analyzer</h1>
            <div className="flex flex-col items-end">
              <Button variant="outline" size="sm" onClick={exitSession}>
                Exit Session
              </Button>
              {selectedVersion && (
                <p className="mt-2 text-sm text-slate-600">
                  Data version: {selectedVersion}
                </p>
              )}
            </div>
          </header>
          <Card className="max-w-2xl">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Review complete</h2>
              <p className="text-slate-600 mb-6">
                You reviewed all {groups.length} groups. Summary of your decisions:
              </p>
              <ul className="space-y-3">
                {FILTER_OPTIONS.map((rec) => {
                  const count = summaryCombined[rec] ?? 0
                  if (count === 0) return null
                  return (
                    <li key={rec} className="flex items-center justify-between gap-4">
                      <span
                        className={`inline-block rounded px-2 py-1 text-sm font-medium text-white ${FILTER_COLORS[rec]}`}
                      >
                        {FILTER_LABELS[rec]}
                      </span>
                      <span className="text-slate-600 tabular-nums">{count} {count === 1 ? 'group' : 'groups'}</span>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
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
        {sessionError && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {sessionError}
            <span className="ml-2 text-amber-600">(Decisions are saved locally until the session service is available.)</span>
          </div>
        )}
        <header className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Content Migration Analyzer</h1>
              <p className="text-slate-500 text-sm mt-1">
                Prepared for: New York School of Interior Design
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {email && <span>Session: {email}</span>}
                {sessionSyncStatus === 'saved' && <span className="ml-2 text-emerald-600">· Saved</span>}
                {sessionSyncStatus === 'syncing' && <span className="ml-2 text-slate-400">· Saving…</span>}
                {sessionSyncStatus === 'error' && <span className="ml-2 text-amber-600">· Save failed (retry by saving another decision)</span>}
                {sessionId && typeof window !== 'undefined' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const url = `${window.location.origin}${window.location.pathname}?sessionId=${encodeURIComponent(sessionId)}`
                      try {
                        if (navigator.clipboard?.writeText) {
                          await navigator.clipboard.writeText(url)
                        } else {
                          const input = document.createElement('input')
                          input.value = url
                          input.readOnly = true
                          input.style.position = 'absolute'
                          input.style.left = '-9999px'
                          document.body.appendChild(input)
                          input.select()
                          document.execCommand('copy')
                          document.body.removeChild(input)
                        }
                        setCopyResumeStatus('copied')
                        setTimeout(() => setCopyResumeStatus('idle'), 2000)
                      } catch {
                        setCopyResumeStatus('error')
                        setTimeout(() => setCopyResumeStatus('idle'), 2000)
                      }
                    }}
                    className="ml-2 text-slate-500 hover:text-slate-700 underline"
                    title="Copy a link to open this session on another device or later"
                  >
                    {copyResumeStatus === 'copied' ? 'Copied!' : copyResumeStatus === 'error' ? 'Copy failed' : 'Copy resume link'}
                  </button>
                )}
              </p>
              <p className="text-slate-600 mt-2">
            Group {currentIndex + 1} of {filteredGroups.length}
            {showMoreCategory
              ? ` (${SHOW_MORE_CATEGORIES.find((c) => c.urlGroup === showMoreCategory)?.label ?? showMoreCategory})`
              : recFilter !== 'all'
                ? ` (${FILTER_LABELS[recFilter] ?? recFilter} only)`
                : ''}{' '}
            · {Object.keys(decisions).length} saved
              </p>
            </div>
            <div className="flex flex-col items-end">
              <Button variant="outline" size="sm" onClick={exitSession}>
                Exit Session
              </Button>
              {selectedVersion && (
                <p className="mt-2 text-sm text-slate-600">
                  Data version: {selectedVersion}
                </p>
              )}
            </div>
          </div>
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

export default function GroupReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    }>
      <GroupReviewPageContent />
    </Suspense>
  )
}
