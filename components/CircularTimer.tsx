interface CircularTimerProps {
  timeRemaining: number;
  totalTime: number;
  isPaused?: boolean;
  isStarted?: boolean;
}

export function CircularTimer({ timeRemaining, totalTime, isPaused = false, isStarted = false }: CircularTimerProps) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = (totalTime - timeRemaining) / totalTime;
  const strokeDashoffset = circumference - (progress * circumference);

  // Use explicit colors instead of CSS classes
  const progressColor = !isStarted ? "#9ca3af" : isPaused ? "#6b7280" : "#3b82f6"; // gray-400 when not started, gray-500 when paused, blue-500 when active
  const textColor = !isStarted ? "#9ca3af" : isPaused ? "#6b7280" : "#000000"; // gray-400 when not started, gray-500 when paused, black when active

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
          stroke="#e5e7eb"
          strokeWidth="1"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke={progressColor}
          strokeWidth="1"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-100 ease-linear"
          strokeLinecap="round"
        />
      </svg>
      {/* Timer text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-mono" style={{ color: textColor }}>
          {!isStarted ? totalTime : Math.ceil(timeRemaining)}
        </span>
      </div>
    </div>
  );
}