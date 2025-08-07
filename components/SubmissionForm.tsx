'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Send } from 'lucide-react'

interface SliderData {
  title: string
  leftSide: string
  rightSide: string
}

interface SubmissionFormProps {
  sliderValues: number[]
  sliderData: SliderData[]
  onSubmit: (submission: any) => Promise<void>
}

export function SubmissionForm({ sliderValues, sliderData, onSubmit }: SubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    comments: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submission = {
        timestamp: new Date().toISOString(),
        name: formData.name || 'Anonymous',
        email: formData.email || '',
        comments: formData.comments || '',
        responses: sliderData.map((slider, index) => ({
          title: slider.title,
          leftSide: slider.leftSide,
          rightSide: slider.rightSide,
          value: sliderValues[index],
          percentage: sliderValues[index]
        })),
        summary: {
          totalSliders: sliderData.length,
          averageValue: sliderValues.reduce((sum, val) => sum + val, 0) / sliderValues.length,
          leftPreferences: sliderValues.filter(val => val <= 25).length,
          rightPreferences: sliderValues.filter(val => val >= 75).length,
          neutralPreferences: sliderValues.filter(val => val > 25 && val < 75).length
        }
      }

      await onSubmit(submission)
      
      // Reset form
      setFormData({ name: '', email: '', comments: '' })
      setShowForm(false)
    } catch (error) {
      console.error('Submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!showForm) {
    return (
      <Button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Send className="h-4 w-4" />
        Submit Assessment
      </Button>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <h3 className="font-medium text-gray-900 mb-4">Submit Your Assessment</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name (optional)
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (optional)
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
              Comments (optional)
            </label>
            <textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional thoughts or feedback..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
