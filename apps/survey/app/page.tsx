'use client'

import { useState } from 'react'
import { Button } from '@repo/ui'

const QUESTIONS = [
  { id: 'q1', text: 'How satisfied are you?', type: 'scale' as const },
  { id: 'q2', text: 'What is your role?', type: 'text' as const },
]

export default function SurveyPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Survey answers:', answers)
    setSubmitted(true)
    // TODO: POST to Payload or API; admin can view tabulated results
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h2 className="text-xl font-semibold text-slate-900">Thank you</h2>
          <p className="mt-2 text-slate-600">Your responses have been recorded.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Survey</h1>
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {QUESTIONS.map((q) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-slate-700">{q.text}</label>
              {q.type === 'scale' ? (
                <select
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={String(n)}>{n}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              )}
            </div>
          ))}
          <Button type="submit">Submit</Button>
        </form>
      </div>
    </div>
  )
}
