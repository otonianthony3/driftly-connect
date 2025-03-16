import React, { useEffect, useState, useCallback } from "react";
import { AlertCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AutoLogoutTimerProps {
  duration: number; // in seconds
  onTimeout: () => void;
  warningThreshold?: number; // percentage of duration when warning appears
  onReset?: () => void; // optional callback to reset timer
  className?: string;
}

export const AutoLogoutTimer: React.FC<AutoLogoutTimerProps> = ({
  duration,
  onTimeout,
  warningThreshold = 25, // default to warning at 25% time remaining
  onReset,
  className = "",
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  
  // Format time left into minutes and seconds
  const formatTimeLeft = useCallback(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [timeLeft]);
  
  // Calculate progress percentage
  const progressPercentage = Math.round((timeLeft / duration) * 100);
  const isWarning = progressPercentage <= warningThreshold;
  
  // Reset timer to initial duration
  const resetTimer = useCallback(() => {
    setTimeLeft(duration);
    if (onReset) {
      onReset();
    }
  }, [duration, onReset]);
  
  // Toggle pause/resume
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  useEffect(() => {
    // Reset timer if duration prop changes
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }
    
    // Only run timer if not paused
    if (!isPaused) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [timeLeft, onTimeout, isPaused]);

  return (
    <div className={`rounded-md border p-3 ${isWarning ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isWarning ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Clock className="h-4 w-4 text-gray-500" />
          )}
          <span className={`text-sm font-medium ${isWarning ? "text-red-700" : "text-gray-700"}`}>
            Session Timeout
          </span>
        </div>
        <span className={`text-sm font-bold ${isWarning ? "text-red-700" : "text-gray-700"}`}>
          {formatTimeLeft()}
        </span>
      </div>
      
      {/* Custom progress bar implementation since shadcn Progress doesn't support indicator styling directly */}
      <div className={`h-2 w-full rounded-full ${isWarning ? "bg-red-100" : "bg-gray-100"}`}>
        <div 
          className={`h-full rounded-full transition-all ${isWarning ? "bg-red-500" : "bg-blue-500"}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2">
        <span className={`text-xs ${isWarning ? "text-red-600" : "text-gray-500"}`}>
          {isWarning ? "You will be logged out soon" : "Auto logout in progress"}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={togglePause}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button 
            onClick={resetTimer}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};