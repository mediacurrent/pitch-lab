'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui'

type Recommendation = 'move' | 'lost' | 'reuse'

interface PageRow {
  id: string
  url: string
  recommendation: Recommendation
  notes?: string
}

export default function ContentRankPage() {
  const [pages, setPages] = useState<PageRow[]>([])
  const [uploadStatus, setUploadStatus] = useState<string>('')

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Content rank</h1>
        <p className="mb-6 text-slate-600">
          Admin uploads ScreamingFrog crawl + GA4 report; pages are ranked by criteria and recommended as <strong>move</strong>, <strong>lost</strong>, or <strong>reuse</strong> for the new site.
        </p>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Uploads (admin)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Admin upload area for ScreamingFrog export and GA4 report. Data is processed and merged; this app displays the ranked table. Implement upload API and parsing in Payload or a server action.
            </p>
            <p className="mt-2 text-sm text-slate-400">{uploadStatus || 'No uploads yet.'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ranked pages</CardTitle>
          </CardHeader>
          <CardContent>
            {pages.length === 0 ? (
              <p className="text-slate-500">No data yet. Upload crawl + GA4 to see ranked pages.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2">URL</th>
                    <th className="text-left py-2">Recommendation</th>
                    <th className="text-left py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="py-2">{row.url}</td>
                      <td className="py-2">{row.recommendation}</td>
                      <td className="py-2">{row.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
