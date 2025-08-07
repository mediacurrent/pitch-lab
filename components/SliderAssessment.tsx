'use client'

import { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { SliderCard } from './SliderCard'
import { SubmissionForm } from './SubmissionForm'
import { RotateCcw, Send } from 'lucide-react'
import { SliderInstance, saveSliderSession, SliderSessionData } from '@/lib/sanity'
import { toast } from 'sonner'

interface SliderAssessmentProps {
  slider: SliderInstance
}

export default function SliderAssessment({ slider }: SliderAssessmentProps) {
  // Initialize slider values with default values (50 = neutral)
  const [sliderValues, setSliderValues] = useState<number[]>(
    slider.sliderPairs.map(() => 50)
  )

  // State to control summary visibility
  const [showSummary, setShowSummary] = useState(false)

  // Ref for the summary section to enable scrolling
  const summaryRef = useRef<HTMLDivElement>(null)

  // Handle value change for individual sliders
  const handleSliderChange = (index: number, value: number) => {
    const newValues = [...sliderValues]
    newValues[index] = value
    setSliderValues(newValues)
  }

  // Reset all sliders to their default values and hide summary
  const handleReset = () => {
    const defaultValues = slider.sliderPairs.map(() => 50)
    setSliderValues(defaultValues)
    setShowSummary(false)
    toast.success('All sliders reset to center')
  }

  // Handle successful submission - reset form
  const handleSubmissionComplete = async (submission: any) => {
    console.log('🚀 Starting slider submission process...')
    
    try {
      // Create session data for Sanity
      const sessionData: SliderSessionData = {
        sessionId: `slider-${Date.now()}`,
        sliderId: slider.id,
        sliderTitle: slider.title,
        votes: slider.sliderPairs.map((pair, index) => ({
          pairTitle: pair.title,
          leftSide: pair.leftSide,
          rightSide: pair.rightSide,
          selectedSide: (sliderValues[index] <= 50 ? 'left' : 'right') as 'left' | 'right',
          timeSpent: 0, // We don't track time for sliders
        })),
        summary: {
          totalVotes: slider.sliderPairs.length,
          leftVotes: sliderValues.filter(val => val <= 25).length,
          rightVotes: sliderValues.filter(val => val >= 75).length,
          averageTimePerVote: 0,
        }
      }

      // Save to Sanity via API route
      const response = await fetch('/api/slider-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Slider session saved to Sanity:', result)
        toast.success('Assessment submitted successfully!')
      } else {
        const errorData = await response.json()
        console.error('❌ API error:', errorData)
        throw new Error('Failed to save session')
      }

      // Reset the form after successful submission
      const defaultValues = slider.sliderPairs.map(() => 50)
      setSliderValues(defaultValues)
      setShowSummary(false)
      
    } catch (error) {
      console.error('💥 Submission failed:', error)
      
      let errorMessage = 'Failed to submit assessment. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = `Submission failed: ${error.message}`
        }
      }
      
      toast.error(errorMessage)
      throw error
    }
  }



  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 rounded-lg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2">
              {slider.title}
            </h1>
            {slider.description && (
              <p className="text-gray-600">{slider.description}</p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">How to Complete This Assessment</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Review each criterion below and drag the sliders based on your preferences</li>
                <li>Click &quot;Submit Assessment&quot; to securely save your responses for analysis</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Slider Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {slider.sliderPairs.map((pair, index) => (
            <SliderCard
              key={index}
              category="Assessment"
              title={pair.title}
              leftLabel={pair.leftSide}
              rightLabel={pair.rightSide}
              defaultValue={50}
              number={`${String(index + 1).padStart(2, '0')}`}
              value={sliderValues[index]}
              onValueChange={(value) => handleSliderChange(index, value)}
            />
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All
          </Button>

          <SubmissionForm 
            sliderValues={sliderValues}
            sliderData={slider.sliderPairs}
            onSubmit={handleSubmissionComplete}
          />
        </div>
      </div>
    </div>
  )
}
