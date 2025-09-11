'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { SwipeCard } from './SwipeCard'
import { Heart, RotateCcw, Skull, GitMerge, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { SwiperInstance, WebsiteEntry, saveSwiperSession } from '@/lib/sanity'

interface SwiperAssessmentProps {
  swiperInstance: SwiperInstance
}

const SwiperAssessment: React.FC<SwiperAssessmentProps> = ({ swiperInstance }) => {
  const [websites] = useState<WebsiteEntry[]>(swiperInstance.websites)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [keptWebsites, setKeptWebsites] = useState<WebsiteEntry[]>([])
  const [killedWebsites, setKilledWebsites] = useState<WebsiteEntry[]>([])
  const [skippedWebsites, setSkippedWebsites] = useState<WebsiteEntry[]>([])
  const [triggerAction, setTriggerAction] = useState<'left' | 'right' | 'up' | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Track start time when component mounts
  useEffect(() => {
    setStartTime(Date.now())
  }, [])

  // Submit results when all cards are swiped
  const submitResults = useCallback(async (): Promise<void> => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const now = new Date()
      const totalTime = Math.round((now.getTime() - startTime) / 1000)

      const result = await saveSwiperSession({
        sessionId,
        swiperId: swiperInstance.id,
        swiperTitle: swiperInstance.title,
        keptWebsites: keptWebsites.map(w => w.name),
        killedWebsites: killedWebsites.map(w => w.name),
        skippedWebsites: skippedWebsites.map(w => w.name),
        totalTime,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
      })

      if (result) {
        setSubmitted(true)
        console.log('✅ Swiper session saved successfully:', result)
      } else {
        setSubmitError('Failed to save results')
      }
    } catch (error) {
      console.error('❌ Error saving swiper session:', error)
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }, [keptWebsites, killedWebsites, skippedWebsites, startTime, swiperInstance])

  useEffect(() => {
    const hasMoreCards = currentIndex < websites.length
    const hasResults = keptWebsites.length > 0 || killedWebsites.length > 0 || skippedWebsites.length > 0
    
    if (!hasMoreCards && !submitted && !isSubmitting && hasResults) {
      submitResults()
    }
  }, [currentIndex, websites.length, submitted, isSubmitting, submitResults, keptWebsites.length, killedWebsites.length, skippedWebsites.length])

  const handleSwipe = (direction: 'left' | 'right', website: WebsiteEntry): void => {
    if (direction === 'right') {
      setKeptWebsites(prev => [...prev, website])
    } else {
      setKilledWebsites(prev => [...prev, website])
    }
    
    setCurrentIndex(prev => prev + 1)
    setTriggerAction(null) // Reset trigger after action
  }

  const handleSkip = (website: WebsiteEntry): void => {
    setSkippedWebsites(prev => [...prev, website])
    setCurrentIndex(prev => prev + 1)
    setTriggerAction(null) // Reset trigger after action
  }

  const handleButtonAction = (action: 'left' | 'right' | 'up'): void => {
    const currentWebsite = websites[currentIndex]
    if (currentWebsite && !triggerAction) {
      setTriggerAction(action)
      // The actual state updates will be handled by the card's animation callbacks
    }
  }

  const resetStack = (): void => {
    setCurrentIndex(0)
    setKeptWebsites([])
    setKilledWebsites([])
    setSkippedWebsites([])
    setTriggerAction(null)
    setStartTime(Date.now())
    setSubmitted(false)
    setSubmitError(null)
  }

  const hasMoreCards = currentIndex < websites.length
  // Show all remaining cards instead of limiting to 3
  const remainingWebsites = websites.slice(currentIndex)

  return (
    <div 
      className="min-h-screen flex flex-col max-w-[1200px] mx-auto"
      style={{ background: 'linear-gradient(to bottom, white, #e7f3ff)' }}
    >
      {/* Compact header with mobile-optimized padding */}
      <header className="px-5 lg:px-[30px] py-2 sm:py-4 text-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-16 w-auto sm:h-20 flex items-center justify-center">
            <div 
              className="h-full flex items-center justify-center px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#102d51', color: 'white', minWidth: '200px' }}
            >
              <div className="text-center">
                <div className="font-bold text-sm sm:text-lg">PITCH LAB</div>
                <div className="text-xs sm:text-sm">SWIPER</div>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-primary">{swiperInstance.title}</h1>
            <p className="text-muted-foreground text-xs sm:text-base mt-1">{swiperInstance.description}</p>
          </div>
        </div>
      </header>

      {/* Main content with minimal padding for mobile */}
      <div className="flex-1 flex flex-col px-5 lg:px-[30px] py-1">
        {hasMoreCards ? (
          <>
            {/* Compact card container - 275px height for mobile optimization */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-full max-w-sm min-h-[290px] sm:min-h-[350px]">
                <AnimatePresence mode="popLayout">
                  {remainingWebsites.map((website, index) => {
                    const isTop = index === 0
                    const stackIndex = index
                    
                    return (
                      <SwipeCard
                        key={website.id}
                        website={website}
                        onSwipe={handleSwipe}
                        onSkip={handleSkip}
                        isTop={isTop}
                        stackIndex={stackIndex}
                        triggerAction={isTop ? triggerAction : null}
                      />
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Compact progress indicator */}
            <div className="pt-3 pb-6 sm:py-4">
              <div className="w-full lg:max-w-md mx-auto">
                <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mb-2">
                  <span>{currentIndex + 1} of {websites.length}</span>
                  <span>{websites.length - currentIndex - 1} remaining</span>
                </div>
                <div className="w-full bg-[#d4eaff] rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / websites.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Compact action buttons */}
            <div className="pb-4 sm:pb-6">
              <div className="flex items-center justify-center gap-4 sm:gap-6 rounded-full px-4 sm:px-6 py-3 sm:py-4 shadow-2xl mx-auto w-fit" style={{ backgroundColor: '#102d51' }}>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleButtonAction('left')}
                  disabled={!!triggerAction}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full !border-2 !border-red-500 text-red-500 hover:bg-red-500 hover:text-white shadow-lg bg-white dark:bg-gray-800 disabled:opacity-50"
                  title="Kill Website"
                  style={{ border: '2px solid #ef4444' }}
                >
                  <Skull className="!w-5 !h-5" />
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleButtonAction('up')}
                  disabled={!!triggerAction}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full !border-2 !border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white shadow-lg bg-white dark:bg-gray-800 disabled:opacity-50"
                  title="Merge"
                  style={{ border: '2px solid #eab308' }}
                >
                  <GitMerge className="!w-5 !h-5" />
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleButtonAction('right')}
                  disabled={!!triggerAction}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full !border-2 !border-green-500 text-green-500 hover:bg-green-500 hover:text-white shadow-lg bg-white dark:bg-gray-800 disabled:opacity-50"
                  title="Keep Website"
                  style={{ border: '2px solid #22c55e' }}
                >
                  <Heart className="!w-5 !h-5" />
                </Button>
              </div>
              
              {/* Compact button labels */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-2 text-xs sm:text-sm text-muted-foreground">
                <span className="w-12 sm:w-16 text-center font-medium">Kill</span>
                <span className="w-12 sm:w-16 text-center font-medium">Merge</span>
                <span className="w-12 sm:w-16 text-center font-medium">Keep</span>
              </div>
            </div>
          </>
        ) : (
          /* Results screen */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md px-4">
              {/* Submission status */}
              {isSubmitting && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                  <div className="flex items-center justify-center gap-2 text-blue-800 dark:text-blue-200">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>Saving your results...</span>
                  </div>
                </div>
              )}

              {submitted && (
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800 mb-6">
                  <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle className="w-5 h-5" />
                    <span>Results saved successfully!</span>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800 mb-6">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>Failed to save results</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
                  <Button 
                    onClick={submitResults} 
                    size="sm" 
                    className="mt-2"
                    disabled={isSubmitting}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">All Done!</h2>
                <p className="text-muted-foreground">Here&apos;s your {swiperInstance.title} summary</p>
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-1 mb-2">
                    <Heart className="w-3 h-3 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200 text-xs">Kept</span>
                  </div>
                  <div className="text-xl font-bold text-green-800 dark:text-green-200 mb-1">
                    {keptWebsites.length}
                  </div>
                  <div className="space-y-1 text-green-700 dark:text-green-300 text-xs">
                    {keptWebsites.slice(0, 2).map(site => (
                      <div key={site.id} className="truncate">{site.name}</div>
                    ))}
                    {keptWebsites.length > 2 && (
                      <div className="text-xs">+{keptWebsites.length - 2} more</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-1 mb-2">
                    <GitMerge className="w-3 h-3 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200 text-xs">Merge</span>
                  </div>
                  <div className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-1">
                    {skippedWebsites.length}
                  </div>
                  <div className="space-y-1 text-yellow-700 dark:text-yellow-300 text-xs">
                    {skippedWebsites.slice(0, 2).map(site => (
                      <div key={site.id} className="truncate">{site.name}</div>
                    ))}
                    {skippedWebsites.length > 2 && (
                      <div className="text-xs">+{skippedWebsites.length - 2} more</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-1 mb-2">
                    <Skull className="w-3 h-3 text-red-600" />
                    <span className="font-medium text-red-800 dark:text-red-200 text-xs">Killed</span>
                  </div>
                  <div className="text-xl font-bold text-red-800 dark:text-red-200 mb-1">
                    {killedWebsites.length}
                  </div>
                  <div className="space-y-1 text-red-700 dark:text-red-300 text-xs">
                    {killedWebsites.slice(0, 2).map(site => (
                      <div key={site.id} className="truncate">{site.name}</div>
                    ))}
                    {killedWebsites.length > 2 && (
                      <div className="text-xs">+{killedWebsites.length - 2} more</div>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                onClick={resetStack}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Start Over
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SwiperAssessment
