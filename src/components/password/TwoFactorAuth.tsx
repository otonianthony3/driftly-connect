import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Shield, AlertCircle, CheckCircle } from "lucide-react";

interface TwoFactorAuthProps {
  onCodeSubmit: (code: string) => Promise<boolean> | boolean;
  onCancel?: () => void;
  length?: number;
  autoFocus?: boolean;
  className?: string;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({
  onCodeSubmit,
  onCancel,
  length = 6,
  autoFocus = true,
  className
}) => {
  // State for individual digits
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [timer, setTimer] = useState<number>(0);
  
  // Refs for input fields
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(length).fill(null));
  
  // Initialize timer on mount
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Helper to format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Focus on next input after typing
  const focusNextInput = (index: number) => {
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  // Focus on previous input when backspacing
  const focusPrevInput = (index: number) => {
    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
  };

  // Handle input change
  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const newDigits = [...digits];
    
    // Handle paste event with multiple digits
    if (value.length > 1) {
      const pastedDigits = value.split('').slice(0, length - index);
      
      // Fill current and subsequent fields
      for (let i = 0; i < pastedDigits.length; i++) {
        if (index + i < length) {
          newDigits[index + i] = pastedDigits[i];
        }
      }
      
      setDigits(newDigits);
      
      // Focus on appropriate field after paste
      const newActiveIndex = Math.min(index + pastedDigits.length, length - 1);
      setTimeout(() => {
        inputRefs.current[newActiveIndex]?.focus();
        setActiveIndex(newActiveIndex);
      }, 0);
    } else {
      // Normal single digit input
      newDigits[index] = value;
      setDigits(newDigits);
      
      if (value !== '') {
        focusNextInput(index);
      }
    }
    
    // Reset status on new input
    if (status !== "idle") {
      setStatus("idle");
      setErrorMessage("");
    }
  };

  // Handle key press
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index] === "") {
        focusPrevInput(index);
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft") {
      focusPrevInput(index);
    } else if (e.key === "ArrowRight") {
      focusNextInput(index);
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only allow digits
    if (!/^\d+$/.test(pastedData)) return;
    
    handleChange(index, pastedData);
  };

  // Submit the code
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    
    // Validate code length
    if (code.length !== length) {
      setStatus("error");
      setErrorMessage(`Please enter all ${length} digits`);
      return;
    }
    
    setStatus("loading");
    
    try {
      const result = await onCodeSubmit(code);
      if (result === false) {
        setStatus("error");
        setErrorMessage("Invalid verification code. Please try again.");
        // Reset digits on error
        setDigits(Array(length).fill(""));
        setActiveIndex(0);
        inputRefs.current[0]?.focus();
      } else {
        setStatus("success");
        // Start a timer to show success message
        setTimeout(() => {
          if (status === "success") {
            setStatus("idle");
          }
        }, 2000);
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("An error occurred. Please try again.");
      console.error("2FA submission error:", error);
    }
  };

  // Reset the form
  const resetForm = () => {
    setDigits(Array(length).fill(""));
    setActiveIndex(0);
    setStatus("idle");
    setErrorMessage("");
    inputRefs.current[0]?.focus();
  };

  // Auto focus the first input on mount
  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
      </div>
      
      <p className="text-sm text-gray-600">
        Enter the verification code sent to your device to complete the authentication process.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="code-input-0" className="text-sm font-medium text-gray-700">
            Verification Code
          </label>
          
          <div className="flex justify-center space-x-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                id={`code-input-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => handlePaste(e, index)}
                className={cn(
                  "w-12 h-12 text-center text-xl font-bold rounded-md",
                  "border-2 focus:outline-none transition-colors duration-200",
                  activeIndex === index ? "border-blue-500 bg-blue-50" : "border-gray-300",
                  status === "error" ? "border-red-500 bg-red-50" : "",
                  status === "success" ? "border-green-500 bg-green-50" : "",
                  status === "loading" ? "border-gray-300 bg-gray-100" : "",
                  "disabled:bg-gray-100 disabled:cursor-not-allowed"
                )}
                disabled={status === "loading" || status === "success"}
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "code-error" : undefined}
              />
            ))}
          </div>
          
          {status === "error" && (
            <div id="code-error" className="flex items-center text-red-500 text-sm mt-2">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          {status === "success" && (
            <div className="flex items-center text-green-500 text-sm mt-2">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>Verification successful!</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={resetForm}
            className="text-sm text-blue-500 hover:text-blue-700 transition-colors"
          >
            Reset
          </button>
          
          {timer > 0 && (
            <span className="text-sm text-gray-500">
              Resend in {formatTime(timer)}
            </span>
          )}
        </div>
        
        <div className="flex space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md",
                "border border-gray-300 text-gray-700",
                "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
                "transition-colors duration-200",
                "flex-1"
              )}
              disabled={status === "loading"}
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md",
              "text-white focus:outline-none focus:ring-2",
              "transition-all duration-200",
              "flex-1",
              status === "loading" ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
              status === "success" ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" : ""
            )}
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading" ? "Verifying..." : status === "success" ? "Verified" : "Verify Code"}
          </button>
        </div>
      </form>
      
      <div className="text-center text-xs text-gray-500 mt-4">
        <p>
          Didn't receive a code?{" "}
          <button 
            type="button"
            onClick={() => {
              // Implement resend logic here
              setTimer(60); // Set timer for 60 seconds
            }}
            className="text-blue-500 hover:text-blue-700 transition-colors font-medium"
            disabled={timer > 0 || status === "loading"}
          >
            Resend code
          </button>
        </p>
      </div>
    </div>
  );
};