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

const TIME_LIMIT = 10; // seconds

interface ImageVotingProps {
  images?: ImageEntry[];
}

export function ImageVoting({ images = [] }: ImageVotingProps) {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(TIME_LIMIT);
  const [votes, setVotes] = useState<VoteResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState<'left' | 'right' | null>(null);
  const [isPaused, setIsPaused] = useState(false);

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

  const availableImages = images.length > 0 ? images : SAMPLE_IMAGES.map((url, index) => ({
    id: `sample-${index}`,
    title: `Sample Image ${index + 1}`,
    imageUrl: url,
    description: '',
    category: 'sample',
    tags: []
  }));

  // Create pairs of images for side-by-side voting
  const imagePairs = [];
  for (let i = 0; i < availableImages.length; i += 2) {
    if (i + 1 < availableImages.length) {
      imagePairs.push([availableImages[i], availableImages[i + 1]]);
    } else {
      // If odd number of images, last image gets paired with itself
      imagePairs.push([availableImages[i], availableImages[i]]);
    }
  }

  const currentPair = imagePairs[currentPairIndex];
  const isLastPair = currentPairIndex === imagePairs.length - 1;

  // Timer effect
  useEffect(() => {
    if (isComplete || isPaused) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - record as timeout and move to next
          if (!hasVoted) {
            setVotes(prevVotes => [...prevVotes, {
              imageId: currentPair[0].id,
              imageUrl: currentPair[0].imageUrl,
              title: currentPair[0].title,
              vote: 'timeout'
            }]);
          }
          nextPair();
          return TIME_LIMIT;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPairIndex, isComplete, hasVoted, currentPair, isPaused]);

  const handleVote = (vote: 'left' | 'right') => {
    if (hasVoted) return;
    
    const selectedImage = currentPair[vote === 'left' ? 0 : 1];
    setVotes(prevVotes => [...prevVotes, {
      imageId: selectedImage.id,
      imageUrl: selectedImage.imageUrl,
      title: selectedImage.title,
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
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const yesVotes = votes.filter(v => v.vote === 'yes').length;
  const noVotes = votes.filter(v => v.vote === 'no').length;
  const timeoutVotes = votes.filter(v => v.vote === 'timeout').length;

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-4 px-6">
      <Card className="p-6 max-w-2xl w-full relative rounded-[0px]">
        {/* Top header with slide counter and circular timer */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center px-[8px] py-[0px]">
          <span className="text-sm text-muted-foreground text-[24px]">
            {currentPairIndex + 1} / {imagePairs.length}
          </span>
          <CircularTimer timeRemaining={timeRemaining} totalTime={TIME_LIMIT} isPaused={isPaused} />
        </div>
        
        {/* Main content with padding to account for header */}
        <div className="pt-12">
          {/* Two images side by side, stacked on mobile */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-center">
            {/* Left Image */}
            <div className="flex-1 flex flex-col items-center">
              <ImageWithFallback 
                src={currentPair[0].imageUrl}
                alt={currentPair[0].title || `Image ${currentPairIndex * 2 + 1}`}
                className="w-full max-w-sm aspect-square object-cover rounded-[0px] mx-[0px] my-[16px]"
              />
              {currentPair[0].title && (
                <div className="text-center mb-2">
                  <h3 className="text-lg font-medium">{currentPair[0].title}</h3>
                  {currentPair[0].description && (
                    <p className="text-sm text-muted-foreground mt-1">{currentPair[0].description}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Right Image */}
            <div className="flex-1 flex flex-col items-center">
              <ImageWithFallback 
                src={currentPair[1].imageUrl}
                alt={currentPair[1].title || `Image ${currentPairIndex * 2 + 2}`}
                className="w-full max-w-sm aspect-square object-cover rounded-[0px] mx-[0px] my-[16px]"
              />
              {currentPair[1].title && (
                <div className="text-center mb-2">
                  <h3 className="text-lg font-medium">{currentPair[1].title}</h3>
                  {currentPair[1].description && (
                    <p className="text-sm text-muted-foreground mt-1">{currentPair[1].description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 justify-center px-[8px] py-[0px]">
            <Button 
              onClick={() => handleVote('left')}
              variant="destructive"
              disabled={hasVoted || isPaused}
              className={`px-8 py-3 transition-opacity duration-300 ${
                hasVoted && selectedVote === 'left' ? 'opacity-50' : ''
              }`}
            >
              Left
            </Button>
            <Button 
              onClick={() => handleVote('right')}
              disabled={hasVoted || isPaused}
              className={`px-8 py-3 transition-opacity duration-300 ${
                hasVoted && selectedVote === 'right' ? 'opacity-50' : ''
              }`}
            >
              Right
            </Button>
          </div>
        </div>
        
        {/* Reset button in lower left */}
        <div className="absolute bottom-4 left-4">
          <Button
            onClick={resetGame}
            variant="outline"
            size="sm"
            className="w-10 h-10 p-0 rounded-[0px]"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Pause button in lower right */}
        <div className="absolute bottom-4 right-4">
          <Button
            onClick={togglePause}
            variant="outline"
            size="sm"
            className="w-10 h-10 p-0 rounded-[0px]"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}