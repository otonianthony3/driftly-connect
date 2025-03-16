import React from "react";

interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl";
  
  /**
   * Custom CSS class names
   */
  className?: string;
  
  /**
   * Optional test id for testing
   */
  "data-testid"?: string;
}

/**
 * LoadingSpinner component displays an animated spinner to indicate loading state
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
  "data-testid": testId = "loading-spinner",
}) => {
  // Define size classes based on the size prop
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
    xl: "w-12 h-12 border-4",
  };

  // Combine all classes
  const spinnerClasses = `
    inline-block 
    rounded-full 
    border-solid 
    border-gray-300 
    border-t-blue-600 
    animate-spin 
    ${sizeClasses[size]} 
    ${className}
  `.trim();

  return (
    <div 
      className={spinnerClasses} 
      data-testid={testId}
      role="status"
      aria-label="Loading"
    />
  );
};

export default LoadingSpinner;