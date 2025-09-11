import React, { useEffect, useRef, forwardRef } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { Heart, Skull, GitMerge } from 'lucide-react'

interface Website {
  id: number
  name: string
  description: string
  cms: string
  dept: string
  category: string
  order: number
}

interface SwipeCardProps {
  website: Website
  onSwipe: (direction: 'left' | 'right', website: Website) => void
  onSkip: (website: Website) => void
  isTop: boolean
  stackIndex: number
  triggerAction: 'left' | 'right' | 'up' | null
}

export const SwipeCard = forwardRef<HTMLDivElement, SwipeCardProps>(
  ({ website, onSwipe, onSkip, isTop, stackIndex, triggerAction }, ref) => {
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-30, 30])
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
    
    // Move all useTransform hooks to top level - always call them
    const killOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0])
    const keepOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1])
    const skipOpacity = useTransform(y, [-100, -50, 0], [1, 0.5, 0])

    const hasTriggered = useRef(false)
    const previousTriggerAction = useRef<'left' | 'right' | 'up' | null>(null)

    // Reset trigger state when triggerAction changes or when card becomes top
    useEffect(() => {
      if (triggerAction !== previousTriggerAction.current) {
        hasTriggered.current = false
        previousTriggerAction.current = triggerAction
      }
    }, [triggerAction])

    // Reset trigger state when card becomes top
    useEffect(() => {
      if (isTop) {
        hasTriggered.current = false
      }
    }, [isTop])

    // Handle programmatic animations when buttons are clicked
    useEffect(() => {
      if (triggerAction && isTop && !hasTriggered.current) {
        hasTriggered.current = true
        
        // Use a more reliable timeout approach
        const timer = setTimeout(() => {
          if (triggerAction === 'left') {
            onSwipe('left', website)
          } else if (triggerAction === 'right') {
            onSwipe('right', website)
          } else if (triggerAction === 'up') {
            onSkip(website)
          }
        }, 300) // Match the animation duration

        return () => clearTimeout(timer)
      }
    }, [triggerAction, isTop, onSwipe, onSkip, website])

    const handleDragEnd = (event: any, info: PanInfo) => {
      const threshold = 100
      if (info.offset.x > threshold) {
        onSwipe('right', website)
      } else if (info.offset.x < -threshold) {
        onSwipe('left', website)
      } else if (info.offset.y < -threshold) {
        onSkip(website)
      }
    }

    // Simplified stacking using pure z-index approach
    const zIndex = 1000 - stackIndex // Higher z-index for cards closer to top
    const scale = 1 - (stackIndex * 0.02) // Subtle scale reduction for depth
    const cardOpacity = 1 // All cards fully visible

    // Determine animation target based on trigger action
    const getAnimateTarget = () => {
      if (triggerAction === 'left') {
        return { 
          x: -400, 
          y: 0, 
          rotate: -30, 
          opacity: 0, 
          scale,
          transition: { duration: 0.3 }
        }
      } else if (triggerAction === 'right') {
        return { 
          x: 400, 
          y: 0, 
          rotate: 30, 
          opacity: 0, 
          scale,
          transition: { duration: 0.3 }
        }
      } else if (triggerAction === 'up') {
        return { 
          x: 0,
          y: -400, 
          rotate: 0, 
          opacity: 0, 
          scale: scale * 0.8,
          transition: { duration: 0.3 }
        }
      } else {
        // Default positioning - all cards in same position, differentiated by z-index and scale
        return {
          x: 0,
          y: 0,
          rotate: 0,
          opacity: cardOpacity,
          scale,
          transition: {
            type: "spring" as const,
            stiffness: 260,
            damping: 20
          }
        }
      }
    }

    return (
      <motion.div
        ref={ref}
        className={`absolute inset-0 w-full h-full ${isTop && !triggerAction ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
        style={{ 
          x: isTop && !triggerAction ? x : 0,
          y: isTop && !triggerAction ? y : 0,
          rotate: isTop && !triggerAction ? rotate : 0,
          opacity: isTop && !triggerAction ? opacity : cardOpacity,
          zIndex
        }}
        drag={isTop && !triggerAction ? true : false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.05 }}
        initial={{ 
          scale,
          x: 0,
          y: 0,
          rotate: 0,
          opacity: cardOpacity
        }}
        animate={getAnimateTarget()}
      >
        <div className="relative w-full h-full bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
          {/* Add shadow intensity based on stack position for depth */}
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ 
              boxShadow: `0 ${stackIndex * 2 + 4}px ${stackIndex * 4 + 20}px rgba(0, 0, 0, ${0.1 + stackIndex * 0.05})` 
            }}
          />
          
          {/* Swipe indicators - only show on top card with mobile-optimized sizing */}
          {isTop && !triggerAction && (
            <>
              <motion.div
                className="absolute top-6 left-6 bg-destructive text-destructive-foreground px-3 py-2 rounded-full flex items-center gap-2 z-10 text-sm"
                style={{ opacity: killOpacity }}
              >
                <Skull className="w-4 h-4" />
                <span>KILL</span>
              </motion.div>
              
              <motion.div
                className="absolute top-6 right-6 bg-green-500 text-white px-3 py-2 rounded-full flex items-center gap-2 z-10 text-sm"
                style={{ opacity: keepOpacity }}
              >
                <Heart className="w-4 h-4" />
                <span>KEEP</span>
              </motion.div>

              <motion.div
                className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-3 py-2 rounded-full flex items-center gap-2 z-10 text-sm"
                style={{ opacity: skipOpacity }}
              >
                <GitMerge className="w-4 h-4" />
                <span>MERGE</span>
              </motion.div>
            </>
          )}

          {/* Show action feedback when buttons are pressed - mobile-optimized */}
          {isTop && triggerAction && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
              {triggerAction === 'left' && (
                <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full flex items-center gap-2">
                  <Skull className="w-5 h-5" />
                  <span>KILLED!</span>
                </div>
              )}
              {triggerAction === 'right' && (
                <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  <span>KEPT!</span>
                </div>
              )}
              {triggerAction === 'up' && (
                <div className="bg-yellow-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                  <GitMerge className="w-5 h-5" />
                  <span>MERGED!</span>
                </div>
              )}
            </div>
          )}

          {/* Mobile-optimized card content */}
          <div className="relative h-full flex flex-col justify-between p-6 sm:px-5 sm:py-8 z-5">
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center space-y-4 sm:space-y-4">
                <div className="space-y-2">
                  <div className="inline-block px-3 py-1 bg-[#e7f3ff] text-primary rounded-full text-sm">
                    {website.category}
                  </div>
                  <h1 
                    className="text-2xl sm:text-4xl font-bold leading-tight text-primary">
                    {website.name}
                  </h1>
                </div>
                <p className="text-base sm:text-md text-muted-foreground max-w-md mx-auto leading-relaxed">
                  <span className="text-nowrap">{website.description}</span>
                  <ul className="list-none p-0 mt-3 flex flex-row gap-5 justify-center">
                    <li className="text-[10px] flex flex-col justify-center leading-normal"><span className="uppercase">Technology</span><strong>{website.cms}</strong></li>
                    <li className="text-[10px] flex flex-col justify-center leading-normal"><span className="uppercase">Department</span><strong>{website.dept}</strong></li>
                  </ul>
                </p>
              </div>
            </div>
            
            {/* Only show instructions on top card when not animating - mobile-optimized */}
            {isTop && !triggerAction && (
              <div className="text-center text-muted-foreground mt-4">
                <p className="text-sm">Swipe or use buttons to choose</p>
              </div>
            )}
          </div>

          {/* Add a subtle overlay for stacked cards to create depth */}
          {!isTop && (
            <div 
              className="absolute inset-0 bg-black/5 dark:bg-white/5 pointer-events-none rounded-2xl" 
              style={{ opacity: Math.min(stackIndex * 0.1, 0.3) }}
            />
          )}
        </div>
      </motion.div>
    )
  }
)

SwipeCard.displayName = 'SwipeCard'
