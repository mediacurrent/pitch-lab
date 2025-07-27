'use client'

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { CircularTimer } from './CircularTimer';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { ImageEntry } from '@/lib/sanity';

interface VoteResult {
  imageId: string;
  imageUrl1: string;
  imageUrl2: string;
  title: string;
  selectedImage: 'left' | 'right' | 'timeout';
}

interface ImageVotingProps {
  images?: ImageEntry[];
  timerLength?: number;
  instanceTitle?: string;
  instanceDescription?: string;
}

export function ImageVoting({ 
  images = [], 
  timerLength = 10,
  instanceTitle,
  instanceDescription 
}: ImageVotingProps) {
  const TIME_LIMIT = timerLength; // Use the instance's timer length
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(TIME_LIMIT);
  const [votes, setVotes] = useState<VoteResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState<'left' | 'right' | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Use CMS images if available, otherwise fall back to sample images
  const SAMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=600&fit=crop'
  ];

  // Each ImageEntry from Sanity already contains a complete pair (imageUrl1 and imageUrl2)
  // So we don't need to create pairs - each entry is already a voting pair
  const availableImagePairs = images.length > 0 ? images : SAMPLE_IMAGES.map((url, index) => ({
    id: `sample-${index}`,
    title: `Sample Pair ${index + 1}`,
    imageUrl1: url,
    imageUrl2: SAMPLE_IMAGES[(index + 1) % SAMPLE_IMAGES.length], // Use modulo to wrap around
    category: 'sample',
    status: 'active'
  }));

  const currentPair = availableImagePairs[currentPairIndex] || null;
  const isLastPair = currentPairIndex === availableImagePairs.length - 1;
  






  // Timer effect
  useEffect(() => {
    if (isComplete || isPaused || !isStarted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0.1) {
          // Time's up - record as timeout and move to next
          if (!hasVoted) {
            setVotes(prevVotes => [...prevVotes, {
              imageId: currentPair.id,
              imageUrl1: currentPair.imageUrl1,
              imageUrl2: currentPair.imageUrl2,
              title: currentPair.title,
              selectedImage: 'timeout'
            }]);
          }
          nextPair();
          return TIME_LIMIT;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentPairIndex, isComplete, hasVoted, currentPair, isPaused, isStarted]);

  const handleVote = (vote: 'left' | 'right') => {
    if (hasVoted) return;
    
    setVotes(prevVotes => [...prevVotes, {
      imageId: currentPair.id,
      imageUrl1: currentPair.imageUrl1,
      imageUrl2: currentPair.imageUrl2,
      title: currentPair.title,
      selectedImage: vote
    }]);
    setHasVoted(true);
    setSelectedVote(vote);
    
    // Brief delay before moving to next pair
    setTimeout(() => {
      nextPair();
    }, 500);
  };

  const nextPair = () => {
    if (isLastPair) {
      setIsComplete(true);
    } else {
      setCurrentPairIndex(prev => prev + 1);
      setTimeRemaining(TIME_LIMIT);
      setHasVoted(false);
      setSelectedVote(null);
      // Auto-start timer on subsequent slides (not the first slide)
      setIsStarted(true);
    }
  };

  const resetGame = () => {
    setCurrentPairIndex(0);
    setTimeRemaining(TIME_LIMIT);
    setVotes([]);
    setIsComplete(false);
    setHasVoted(false);
    setSelectedVote(null);
    setIsPaused(false);
    // Reset to manual start for first slide
    setIsStarted(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const leftVotes = votes.filter(v => v.selectedImage === 'left').length;
  const rightVotes = votes.filter(v => v.selectedImage === 'right').length;
  const timeoutVotes = votes.filter(v => v.selectedImage === 'timeout').length;

  // Handle case where no images are available
  if (!currentPair || !currentPair.imageUrl1 || !currentPair.imageUrl2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-4 px-6">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="mb-6">No Images Available</h1>
          <p className="text-muted-foreground">
            Please add some images to your CMS to start voting.
          </p>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-4 px-6">
        <Card className="px-6 py-20 max-w-[1280px] w-full relative rounded-[0.25rem] border-0 bg-gray-200">
          <div className="space-y-8">
            {/* Results Summary */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-black">{leftVotes}</div>
                <div className="text-sm text-muted-foreground">This</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-black">{rightVotes}</div>
                <div className="text-sm text-muted-foreground">That</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-500">{timeoutVotes}</div>
                <div className="text-sm text-muted-foreground">Timed Out</div>
              </div>
            </div>

            {/* Selected Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* This Images */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-center">This</h3>
                <div className="space-y-4">
                  {votes.filter(v => v.selectedImage === 'left').map((vote, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg">
                      <img 
                        src={vote.imageUrl1} 
                        alt={vote.title}
                        className="w-full h-24 object-contain rounded"
                      />
                      <p className="text-sm text-muted-foreground mt-2">{vote.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* That Images */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-center">That</h3>
                <div className="space-y-4">
                  {votes.filter(v => v.selectedImage === 'right').map((vote, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg">
                      <img 
                        src={vote.imageUrl2} 
                        alt={vote.title}
                        className="w-full h-24 object-contain rounded"
                      />
                      <p className="text-sm text-muted-foreground mt-2">{vote.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Again Button */}
            <div className="text-center">
              <Button 
                onClick={resetGame} 
                variant="outline"
                className="px-8 h-12 rounded-[0.25rem] hover:bg-black hover:text-white transition-colors duration-300"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Start Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show loading or error state if no pairs available
  if (!currentPair) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-4 px-6">
        <Card className="px-6 py-20 max-w-[1280px] w-full relative rounded-[0.25rem] border-0 bg-gray-200">
          <div className="text-center">
            <h2 className="text-lg font-medium text-foreground">No image pairs available</h2>
            <p className="text-muted-foreground">Please add some image options to your CMS.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-4 px-6">
      <Card className="px-6 py-20 max-w-[1280px] w-full relative rounded-[0.25rem] border-0 bg-gray-200">
        {/* Top header with slide counter and title */}
        <div className="absolute top-6 left-4 right-4 flex justify-between items-start px-[8px] py-[0px]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground text-[24px]">
                {currentPairIndex + 1} / {availableImagePairs.length}
              </span>
              {currentPair.title && (
                <h2 className="text-lg font-medium text-foreground">
                  {currentPair.title}
                </h2>
              )}
            </div>
            {/* Timer under title on small screens, centered on larger screens */}
            <div className="md:hidden">
              <CircularTimer timeRemaining={timeRemaining} totalTime={TIME_LIMIT} isPaused={isPaused} isStarted={isStarted} />
            </div>
          </div>
          
          {/* Start button inline with reset button on small screens */}
          <div className="flex items-center gap-8 md:hidden">
            {!isStarted && (
              <Button
                onClick={() => setIsStarted(true)}
                variant="outline"
                size="sm"
                className="px-6 h-10 rounded-[0.25rem] uppercase font-light hover:bg-black hover:text-white transition-colors duration-300"
              >
                Start
              </Button>
            )}
            <div className="flex flex-col gap-4">
              <Button
                onClick={resetGame}
                variant="outline"
                size="sm"
                className="w-10 h-10 p-0 rounded-[0.25rem] hover:bg-black hover:text-white transition-colors duration-300"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={togglePause}
                variant="outline"
                size="sm"
                className="w-10 h-10 p-0 rounded-[0.25rem] hover:bg-black hover:text-white transition-colors duration-300"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Centered timer and start button - hidden on small screens */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 hidden md:flex flex-col items-center gap-4">
          <CircularTimer timeRemaining={timeRemaining} totalTime={TIME_LIMIT} isPaused={isPaused} isStarted={isStarted} />
          
          {!isStarted && (
            <Button
              onClick={() => setIsStarted(true)}
              variant="outline"
              size="sm"
              className="px-6 h-10 rounded-[0.25rem] uppercase font-light hover:bg-black hover:text-white transition-colors duration-300"
            >
              Start
            </Button>
          )}
        </div>
        
        {/* Control buttons in top right - hidden on small screens */}
        <div className="absolute top-6 right-4 hidden md:flex flex-col gap-4">
          <Button
            onClick={resetGame}
            variant="outline"
            size="sm"
            className="w-10 h-10 p-0 rounded-[0.25rem] hover:bg-black hover:text-white transition-colors duration-300"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={togglePause}
            variant="outline"
            size="sm"
            className="w-10 h-10 p-0 rounded-[0.25rem] hover:bg-black hover:text-white transition-colors duration-300"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Main content with padding to account for header */}
        <div className="pt-12">
          {/* Two images side by side, stacked on mobile */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            {/* Left Image - Clickable */}
            <div className="flex-1 flex flex-col items-center min-h-96">
              <div 
                className={`flex-1 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  hasVoted || isPaused || !isStarted ? 'pointer-events-none' : ''
                }`}
                onClick={() => !hasVoted && !isPaused && isStarted && handleVote('left')}
              >
               <div className={`relative border-2 border-transparent hover:border-blue-500 rounded-lg p-2 transition-all duration-300 hover:opacity-80 ${
                  hasVoted && selectedVote === 'left' ? 'opacity-50' : ''
                }`}>
                  <ImageWithFallback
                    src={currentPair.imageUrl1}
                    alt={currentPair.title || `Image 1`}
                    className="w-full max-w-sm max-h-96 object-contain rounded-[0px]"
                  />
                </div>
              </div>
            </div>
            
            {/* OR text - hidden on mobile, visible on desktop */}
            <div className="hidden md:flex items-center justify-center">
              <span className="text-2xl font-bold text-foreground px-4">OR</span>
            </div>
            
            {/* Right Image - Clickable */}
            <div className="flex-1 flex flex-col items-center min-h-96">
              <div 
                className={`flex-1 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  hasVoted || isPaused || !isStarted ? 'pointer-events-none' : ''
                }`}
                onClick={() => !hasVoted && !isPaused && isStarted && handleVote('right')}
              >
                <div className={`relative border-2 border-transparent hover:border-blue-500 rounded-lg p-2 transition-all duration-300 hover:opacity-80 ${
                  hasVoted && selectedVote === 'right' ? 'opacity-50' : ''
                }`}>
                  <ImageWithFallback
                    src={currentPair.imageUrl2}
                    alt={currentPair.title || `Image 2`}
                    className="w-full max-w-sm max-h-96 object-contain rounded-[0px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        

      </Card>
    </div>
  );
}