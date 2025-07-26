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
  imageUrl: string;
  title: string;
  vote: 'yes' | 'no' | 'timeout';
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
          imageUrl: currentPair.imageUrl1,
          title: currentPair.title,
          vote: 'timeout'
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
      imageUrl: vote === 'left' ? currentPair.imageUrl1 : currentPair.imageUrl2,
      title: currentPair.title,
      vote: vote === 'left' ? 'yes' : 'no' // Map to yes/no for compatibility
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

  const yesVotes = votes.filter(v => v.vote === 'yes').length;
  const noVotes = votes.filter(v => v.vote === 'no').length;
  const timeoutVotes = votes.filter(v => v.vote === 'timeout').length;

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
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="mb-6">Voting Complete!</h1>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span>Yes votes:</span>
              <span className="text-green-600">{yesVotes}</span>
            </div>
            <div className="flex justify-between">
              <span>No votes:</span>
              <span className="text-red-600">{noVotes}</span>
            </div>
            <div className="flex justify-between">
              <span>Timed out:</span>
              <span className="text-gray-500">{timeoutVotes}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Total images:</span>
              <span>{votes.length}</span>
            </div>
          </div>
          <Button onClick={resetGame} className="w-full">
            Start Again
          </Button>
        </Card>
      </div>
    );
  }

  // Show loading or error state if no pairs available
  if (!currentPair) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-4 px-6">
        <Card className="p-6 max-w-[1280px] w-full relative rounded-[0px] border-0">
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
      <Card className="p-6 max-w-[1280px] w-full relative rounded-[0px] border-0">
        {/* Top header with slide counter and title */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center px-[8px] py-[0px]">
          <div className="flex items-center gap-4">
                                 <span className="text-sm text-muted-foreground text-[24px]">
                       {currentPairIndex + 1} / {availableImagePairs.length}
                     </span>
            {instanceTitle && (
              <h2 className="text-lg font-medium text-foreground">
                {instanceTitle}
              </h2>
            )}
            {currentPair.title && !instanceTitle && (
              <h2 className="text-lg font-medium text-foreground">
                {currentPair.title}
              </h2>
            )}
          </div>
        </div>
        
        {/* Centered timer and start button */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4">
          <CircularTimer timeRemaining={timeRemaining} totalTime={TIME_LIMIT} isPaused={isPaused} isStarted={isStarted} />
          
          {!isStarted && (
            <Button
              onClick={() => setIsStarted(true)}
              variant="outline"
              size="sm"
              className="px-6 h-10 rounded-[0.25rem] uppercase font-light"
            >
              Start
            </Button>
          )}
        </div>
        
        {/* Control buttons in top right */}
        <div className="absolute top-4 right-4 flex flex-col gap-4">
          <Button
            onClick={resetGame}
            variant="outline"
            size="sm"
            className="w-10 h-10 p-0 rounded-[0.25rem]"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={togglePause}
            variant="outline"
            size="sm"
            className="w-10 h-10 p-0 rounded-[0.25rem]"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Main content with padding to account for header */}
        <div className="pt-12">
          {/* Two images side by side, stacked on mobile */}
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {/* Left Image */}
            <div className="flex-1 flex flex-col items-center min-h-96">
              <div className="flex-1 flex items-center justify-center">
                <ImageWithFallback
                  src={currentPair.imageUrl1}
                  alt={currentPair.title || `Image This`}
                  className="w-full max-w-sm max-h-96 object-contain rounded-[0px] mx-[0px] my-[16px]"
                />
              </div>
            </div>
            
            {/* Right Image */}
            <div className="flex-1 flex flex-col items-center min-h-96">
              <div className="flex-1 flex items-center justify-center">
                <ImageWithFallback
                  src={currentPair.imageUrl2}
                  alt={currentPair.title || `Image That`}
                  className="w-full max-w-sm max-h-96 object-contain rounded-[0px] mx-[0px] my-[16px]"
                />
              </div>
            </div>
          </div>
          
                    {/* Voting buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
            {/* This button */}
            <div className="flex-1 flex justify-center">
              <Button 
                onClick={() => handleVote('left')}
                disabled={hasVoted || isPaused || !isStarted}
                variant="outline"
                size="sm"
                className={`px-8 h-10 transition-opacity duration-300 bg-black text-white hover:bg-gray-800 rounded-[0.25rem] uppercase font-light ${
                  hasVoted && selectedVote === 'left' ? 'opacity-50' : ''
                }`}
              >
                This
              </Button>
            </div>
            
            {/* That button */}
            <div className="flex-1 flex justify-center">
              <Button 
                onClick={() => handleVote('right')}
                disabled={hasVoted || isPaused || !isStarted}
                variant="outline"
                size="sm"
                className={`px-8 h-10 transition-opacity duration-300 border-black text-black hover:bg-gray-100 rounded-[0.25rem] uppercase font-light ${
                  hasVoted && selectedVote === 'right' ? 'opacity-50' : ''
                }`}
              >
                That
              </Button>
            </div>
          </div>
        </div>
        

      </Card>
    </div>
  );
}