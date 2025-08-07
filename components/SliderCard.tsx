'use client'

import { useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { RotateCcw } from 'lucide-react'

interface SliderCardProps {
  category: string
  title: string
  leftLabel: string
  rightLabel: string
  defaultValue: number
  number: string
  value: number
  onValueChange: (value: number) => void
}

export function SliderCard({
  category,
  title,
  leftLabel,
  rightLabel,
  defaultValue,
  number,
  value,
  onValueChange,
}: SliderCardProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    onValueChange(newValue)
  }

  const handleSliderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This provides real-time updates while dragging
    const newValue = parseInt(e.target.value)
    onValueChange(newValue)
  }

  const handleReset = () => {
    onValueChange(defaultValue)
  }

  const getPositionClass = (value: number) => {
    if (value <= 25) return 'justify-start'
    if (value <= 75) return 'justify-center'
    return 'justify-end'
  }

  const getValueLabel = (value: number) => {
    if (value <= 25) return leftLabel
    if (value <= 75) return 'Neutral'
    return rightLabel
  }

  const getValueColor = (value: number) => {
    if (value <= 25) return 'text-blue-600'
    if (value <= 75) return 'text-gray-600'
    return 'text-green-600'
  }

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {category}
              </span>
              <span className="text-xs font-medium text-gray-400">
                {number}
              </span>
            </div>
            <h3 className="font-medium text-gray-900 mb-3">{title}</h3>
          </div>
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={handleSliderChange}
              onInput={handleSliderInput}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider transition-all duration-150 ease-out"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`
              }}
            />
          </div>

          {/* Labels */}
          <div className="flex justify-between text-xs text-gray-500">
            <span className="max-w-[40%] text-left">{leftLabel}</span>
            <span className="max-w-[40%] text-right">{rightLabel}</span>
          </div>

          {/* Current selection */}
          <div className={`text-center ${getValueColor(value)}`}>
            <span className="text-sm font-medium">{getValueLabel(value)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
