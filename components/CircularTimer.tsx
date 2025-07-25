interface CircularTimerProps {
  timeRemaining: number;
  totalTime: number;
  isPaused?: boolean;
}

export function CircularTimer({ timeRemaining, totalTime, isPaused = false }: CircularTimerProps) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = (totalTime - timeRemaining) / totalTime;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className="relative w-16 h-16">
      <svg
        className="w-16 h-16 transform -rotate-90"
        viewBox="0 0 56 56"
      >
        {/* Background circle */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-muted-foreground/20"
        />
        {/* Progress circle */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${isPaused ? 'text-muted-foreground' : 'text-primary'} transition-all duration-1000 ease-linear`}
          strokeLinecap="round"
        />
      </svg>
      {/* Timer text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-mono ${isPaused ? 'text-muted-foreground' : ''}`}>
          {timeRemaining}
        </span>
      </div>
    </div>
  );
}