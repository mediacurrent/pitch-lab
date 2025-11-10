'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [userName, setUserName] = useState('')

  // Ref to store the timeout handler
  const timeoutHandlerRef = useRef<(() => void) | null>(null)

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
      // Simple approach: keep timer running if it was started
      if (hasStarted) {
        setIsActive(true)
      }
    } else {
      // All images voted on
      setShowSummary(true)
      setIsActive(false)
    }
  }, [currentImage, timerLength, timeLeft, currentIndex, images.length, hasStarted])

  // Handle timeout separately to avoid circular dependency
  const handleTimeout = useCallback(() => {
    if (!currentImage) return

    const vote: Vote = {
      imagePairTitle: currentImage.title,
      imageUrl1: currentImage.imageUrl1,
      imageUrl2: currentImage.imageUrl2,
      selectedImage: 'timeout',
      timeSpent: timerLength
    }

    setVotes(prev => [...prev, vote])

    // Move to next image or show summary
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setTimeLeft(timerLength)
      // Simple approach: keep timer running if it was started
      if (hasStarted) {
        setIsActive(true)
      }
    } else {
      // All images voted on
      setShowSummary(true)
      setIsActive(false)
    }
  }, [currentImage, timerLength, currentIndex, images.length, hasStarted])

  // Timer effect
  useEffect(() => {
    if (!isActive || isPaused) {
      return
    }

    let interval: NodeJS.Timeout | null = null

    interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - record timeout
          if (timeoutHandlerRef.current) {
            timeoutHandlerRef.current()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isActive, isPaused])

  // Update the timeout handler ref when handleTimeout changes
  useEffect(() => {
    timeoutHandlerRef.current = handleTimeout
  }, [handleTimeout])

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
    setUserName('')
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
          userName: userName || 'Anonymous',
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
                <div className="text-sm text-gray-600">This</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {votes.filter(v => v.selectedImage === 'right').length}
                </div>
                <div className="text-sm text-gray-600">That</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {votes.filter(v => v.selectedImage === 'timeout').length}
                </div>
                <div className="text-sm text-gray-600">Timeouts</div>
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-8">
              <div className="max-w-md mx-auto">
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Start Over
              </Button>
              <Button onClick={handleSubmit} className="bg-black hover:bg-gray-800 text-white">
                Save Results
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
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{instanceTitle}</h1>
              {instanceDescription && (
                <p className="text-gray-600 mt-2">{instanceDescription}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-4">
              {/* Image counter badge - upper right */}
              <Badge variant="outline">
                {currentIndex + 1} of {images.length}
              </Badge>
              
              {/* Timer Controls - Right side under badge */}
              {hasStarted && (
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={pauseTimer} 
                    variant={isPaused ? "default" : "outline"}
                    disabled={!isActive}
                    size="sm"
                  >
                    {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button onClick={resetTimer} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              )}
              
              {/* Circular Timer - Right side under controls */}
              <div className="relative w-20 h-20">
                {/* Background circle */}
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#3b82f6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - (timerLength - timeLeft) / timerLength)}`}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                {/* Time display in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800">
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div>
          {/* Timer Controls - Center */}
          <div className="flex justify-center gap-4 mb-8">
            {!hasStarted ? (
              <Button onClick={startTimer} className="bg-black hover:bg-gray-800 text-white">
                <Play className="h-4 w-4 mr-2" />
                Start Voting
              </Button>
            ) : null}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mb-8">
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

          {/* Image Pair */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card 
              className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg overflow-hidden"
              onClick={() => handleImageClick('left')}
            >
              <CardContent className="[&:last-child]:pb-2 p-0">
                <div className="relative overflow-hidden rounded-t-lg bg-gray-50">
                  <div className="min-h-64 flex items-center justify-center p-4">
                    <img
                      src={currentImage.imageUrl1}
                      alt={currentImage.metadata?.altText1 || 'Left image'}
                      className="w-full h-auto max-h-80 object-contain rounded"
                      style={{ maxWidth: '100%' }}
                      loading="eager"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden text-gray-500 text-center">
                      <p>Image failed to load</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200" />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">This</h3>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg overflow-hidden"
              onClick={() => handleImageClick('right')}
            >
              <CardContent className="[&:last-child]:pb-2 p-0">
                <div className="relative overflow-hidden rounded-t-lg bg-gray-50">
                  <div className="min-h-64 flex items-center justify-center p-4">
                    <img
                      src={currentImage.imageUrl2}
                      alt={currentImage.metadata?.altText2 || 'Right image'}
                      className="w-full h-auto max-h-80 object-contain rounded"
                      style={{ maxWidth: '100%' }}
                      loading="eager"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden text-gray-500 text-center">
                      <p>Image failed to load</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200" />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">That</h3>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
