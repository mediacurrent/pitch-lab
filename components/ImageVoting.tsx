'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Clock,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'

interface ImageEntry {
  id: string
  title: string
  imageUrl1: string
  imageUrl2: string
  status?: string
  metadata?: {
    altText1?: string
    altText2?: string
    credit?: string
    location?: string
  }
}

interface ImageVotingProps {
  images: ImageEntry[]
  timerLength: number
  instanceTitle: string
  instanceDescription?: string
  instanceId: string
}

interface Vote {
  imagePairTitle: string
  imageUrl1: string
  imageUrl2: string
  selectedImage: 'left' | 'right' | 'timeout'
  timeSpent: number
}

export function ImageVoting({
  images,
  timerLength,
  instanceTitle,
  instanceDescription,
  instanceId
}: ImageVotingProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timerLength)
  const [votes, setVotes] = useState<Vote[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const currentImage = images[currentIndex]

  const handleVote = useCallback((selected: 'left' | 'right' | 'timeout') => {
    if (!currentImage) return

    const vote: Vote = {
      imagePairTitle: currentImage.title,
      imageUrl1: currentImage.imageUrl1,
      imageUrl2: currentImage.imageUrl2,
      selectedImage: selected,
      timeSpent: timerLength - timeLeft
    }

    setVotes(prev => [...prev, vote])

    // Move to next image or show summary
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setTimeLeft(timerLength)
      setIsActive(false)
      setIsPaused(false)
      setHasStarted(false)
    } else {
      // All images voted on
      setShowSummary(true)
      setIsActive(false)
    }
  }, [currentImage, timerLength, timeLeft, currentIndex, images.length])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - record timeout
            handleVote('timeout')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, isPaused, timeLeft, handleVote])

  const startTimer = useCallback(() => {
    setIsActive(true)
    setHasStarted(true)
    setTimeLeft(timerLength)
  }, [timerLength])

  const pauseTimer = () => {
    setIsPaused(!isPaused)
  }

  const resetTimer = () => {
    setIsActive(false)
    setIsPaused(false)
    setTimeLeft(timerLength)
    setHasStarted(false)
  }

  const handleImageClick = (side: 'left' | 'right') => {
    if (!hasStarted) {
      startTimer()
    }
    handleVote(side)
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: 'Anonymous',
          instanceId,
          instanceTitle,
          votes,
          summary: {
            totalVotes: votes.length,
            leftVotes: votes.filter(v => v.selectedImage === 'left').length,
            rightVotes: votes.filter(v => v.selectedImage === 'right').length,
            timeoutVotes: votes.filter(v => v.selectedImage === 'timeout').length,
            averageTimePerVote: votes.reduce((sum, v) => sum + v.timeSpent, 0) / votes.length
          }
        }),
      })

      if (response.ok) {
        toast.success('Voting session saved successfully!')
        // Reset for new session
        setVotes([])
        setCurrentIndex(0)
        setShowSummary(false)
        resetTimer()
      } else {
        throw new Error('Failed to save session')
      }
    } catch (error) {
      console.error('Error saving session:', error)
      toast.error('Failed to save voting session')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (showSummary) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Voting Complete!</h1>
              <p className="text-gray-600">Thank you for participating in this voting session.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{votes.length}</div>
                <div className="text-sm text-gray-600">Total Votes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {votes.filter(v => v.selectedImage === 'left').length}
                </div>
                <div className="text-sm text-gray-600">Left Choices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {votes.filter(v => v.selectedImage === 'right').length}
                </div>
                <div className="text-sm text-gray-600">Right Choices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {votes.filter(v => v.selectedImage === 'timeout').length}
                </div>
                <div className="text-sm text-gray-600">Timeouts</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                Save Results
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Start Over
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!currentImage) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">No images available</h1>
          <p className="text-gray-600">This voting instance has no image pairs configured.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{instanceTitle}</h1>
              {instanceDescription && (
                <p className="text-gray-600 mt-2">{instanceDescription}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {currentIndex + 1} of {images.length}
              </Badge>
              <Badge variant="outline">
                {formatTime(timeLeft)}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((timerLength - timeLeft) / timerLength) * 100}%` }}
            />
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center gap-4 mb-8">
            {!hasStarted ? (
              <Button onClick={startTimer} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Start Voting
              </Button>
            ) : (
              <>
                <Button 
                  onClick={pauseTimer} 
                  variant={isPaused ? "default" : "outline"}
                  disabled={!isActive}
                >
                  {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button onClick={resetTimer} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Image Pair */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card 
            className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
            onClick={() => handleImageClick('left')}
          >
            <CardContent className="p-0">
              <div className="aspect-square relative overflow-hidden rounded-t-lg">
                <img
                  src={currentImage.imageUrl1}
                  alt={currentImage.metadata?.altText1 || 'Left image'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">This</h3>
                <p className="text-gray-600">Click to vote for this option</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
            onClick={() => handleImageClick('right')}
          >
            <CardContent className="p-0">
              <div className="aspect-square relative overflow-hidden rounded-t-lg">
                <img
                  src={currentImage.imageUrl2}
                  alt={currentImage.metadata?.altText2 || 'Right image'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">That</h3>
                <p className="text-gray-600">Click to vote for this option</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {currentImage.title}
            </p>
            {currentImage.metadata?.credit && (
              <p className="text-xs text-gray-500">
                Credit: {currentImage.metadata.credit}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentIndex(prev => Math.min(images.length - 1, prev + 1))}
            disabled={currentIndex === images.length - 1}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
