'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { SliderInstance, SliderSessionData } from '@/lib/sanity'
import { Pause, Play, RotateCcw } from 'lucide-react'

interface VoteResult {
  pairTitle: string
  leftSide: string
  rightSide: string
  selectedSide: 'left' | 'right'
  timeSpent: number
}

interface SliderVotingProps {
  slider: SliderInstance
}

export default function SliderVoting({ slider }: SliderVotingProps) {
  const [currentPairIndex, setCurrentPairIndex] = useState(0)
  const [votes, setVotes] = useState<VoteResult[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const [userName, setUserName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [sessionSaved, setSessionSaved] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const currentPair = slider.sliderPairs[currentPairIndex] || null
  const isLastPair = currentPairIndex === slider.sliderPairs.length - 1

  const handleVote = (side: 'left' | 'right') => {
    if (hasVoted || isComplete) return

    setSelectedSide(side)
    setShowConfirmation(true)
  }

  const confirmVote = () => {
    if (!selectedSide || hasVoted || isComplete) return

    const voteTime = Date.now() - startTime
    const voteResult: VoteResult = {
      pairTitle: currentPair.title,
      leftSide: currentPair.leftSide,
      rightSide: currentPair.rightSide,
      selectedSide: selectedSide,
      timeSpent: voteTime / 1000, // Convert to seconds
    }

    setVotes(prevVotes => [...prevVotes, voteResult])
    setHasVoted(true)
    setShowConfirmation(false)

    // Auto-advance after a short delay
    setTimeout(() => {
      nextPair()
    }, 1000)
  }

  const cancelVote = () => {
    setSelectedSide(null)
    setShowConfirmation(false)
  }

  const nextPair = () => {
    if (isLastPair) {
      setIsComplete(true)
      setShowNameInput(true)
    } else {
      setCurrentPairIndex(prev => prev + 1)
      setHasVoted(false)
      setSelectedSide(null)
      setStartTime(Date.now())
    }
  }

  const resetGame = () => {
    setCurrentPairIndex(0)
    setVotes([])
    setIsComplete(false)
    setHasVoted(false)
    setSelectedSide(null)
    setIsPaused(false)
    setIsStarted(false)
    setShowNameInput(false)
    setSessionSaved(false)
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const startGame = () => {
    setIsStarted(true)
    setStartTime(Date.now())
  }

  const saveSession = async (userName: string) => {
    if (sessionSaved) return

    const summary = {
      totalVotes: votes.length,
      leftVotes: votes.filter(v => v.selectedSide === 'left').length,
      rightVotes: votes.filter(v => v.selectedSide === 'right').length,
      averageTimePerVote: votes.reduce((sum, v) => sum + v.timeSpent, 0) / votes.length,
    }

    const sessionData: SliderSessionData = {
      sessionId: `slider-${Date.now()}`,
      sliderId: slider.id,
      sliderTitle: slider.title,
      votes,
      summary,
    }

    try {
      const response = await fetch('/api/slider-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      })

      if (response.ok) {
        setSessionSaved(true)
      }
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  if (showNameInput) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold mb-4">Save Your Results</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium mb-2">
                Your Name (optional)
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>
            <Button 
              onClick={() => saveSession(userName)}
              className="w-full"
              disabled={sessionSaved}
            >
              {sessionSaved ? 'Results Saved!' : 'Save Results'}
            </Button>
            <Button 
              onClick={resetGame}
              variant="outline"
              className="w-full"
            >
              Play Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isComplete) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold mb-4">Voting Complete!</h3>
          <div className="space-y-2 mb-4">
            <p>Total votes: {votes.length}</p>
            <p>Left votes: {votes.filter(v => v.selectedSide === 'left').length}</p>
            <p>Right votes: {votes.filter(v => v.selectedSide === 'right').length}</p>
          </div>
          <Button onClick={() => setShowNameInput(true)} className="w-full">
            Save Results
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!isStarted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold mb-4">Ready to Start?</h3>
          <p className="text-muted-foreground mb-4">
            You'll be presented with {slider.sliderPairs.length} pairs to vote on.
          </p>
          <Button onClick={startGame} className="w-full">
            Start Voting
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!currentPair) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No pairs available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-2">{currentPair.title}</h3>
            <p className="text-muted-foreground">
              Pair {currentPairIndex + 1} of {slider.sliderPairs.length}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              onClick={() => handleVote('left')}
              disabled={hasVoted}
              className={`h-24 text-lg font-medium transition-all ${
                selectedSide === 'left'
                  ? 'bg-blue-600 text-white'
                  : hasVoted
                  ? 'opacity-50'
                  : 'hover:bg-blue-50 hover:border-blue-300'
              }`}
              variant={selectedSide === 'left' ? 'default' : 'outline'}
            >
              {currentPair.leftSide}
            </Button>
            <Button
              onClick={() => handleVote('right')}
              disabled={hasVoted}
              className={`h-24 text-lg font-medium transition-all ${
                selectedSide === 'right'
                  ? 'bg-blue-600 text-white'
                  : hasVoted
                  ? 'opacity-50'
                  : 'hover:bg-blue-50 hover:border-blue-300'
              }`}
              variant={selectedSide === 'right' ? 'default' : 'outline'}
            >
              {currentPair.rightSide}
            </Button>
          </div>

          <div className="flex justify-center gap-2">
            <Button
              onClick={togglePause}
              variant="outline"
              size="sm"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              onClick={resetGame}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
